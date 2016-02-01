package cache

import (
	"errors"
	"log"
	"reflect"
	"sync/atomic"
	"time"

	"github.com/danjac/podbaby/cache/Godeps/_workspace/src/gopkg.in/go-redis/cache.v1/lrucache"
	"github.com/danjac/podbaby/cache/Godeps/_workspace/src/gopkg.in/redis.v3"
)

const defaultExpiration = 3 * 24 * time.Hour

var (
	ErrCacheMiss = errors.New("rediscache: cache miss")
)

type Codec struct {
	Ring *redis.Ring
	// Local LRU cache for hot items.
	Cache *lrucache.Cache

	Marshal   func(interface{}) ([]byte, error)
	Unmarshal func([]byte, interface{}) error

	hits, misses int64
}

type Item struct {
	Key    string
	Object interface{}

	// Expiration is the cache expiration time.
	// Zero means the Item has no expiration time.
	Expiration time.Duration

	// Disables local LRU cache when set to true.
	DisableLocalCache bool
}

func (cd *Codec) Set(item *Item) error {
	if item.Expiration != 0 && item.Expiration < time.Second {
		panic("Expiration can't be less than 1 second")
	}

	if !item.DisableLocalCache && cd.Cache != nil {
		cd.Cache.Set(item.Key, item.Object)
	}

	b, err := cd.Marshal(item.Object)
	if err != nil {
		log.Printf("cache: Marshal failed: %s", err)
		return err
	}

	_, err = cd.Ring.Set(item.Key, b, item.Expiration).Result()
	if err != nil {
		log.Printf("cache: Set %s failed: %s", item.Key, err)
	}
	return err
}

func (cd *Codec) Get(key string, v interface{}) error {
	if cd.Cache != nil {
		elem, ok := cd.Cache.Get(key)
		if ok {
			ev := reflect.ValueOf(elem)
			if ev.Type().Kind() == reflect.Ptr {
				ev = ev.Elem()
			}
			reflect.ValueOf(v).Elem().Set(ev)
			return nil
		}
	}

	b, err := cd.Ring.Get(key).Bytes()
	if err == redis.Nil {
		atomic.AddInt64(&cd.misses, 1)
		return ErrCacheMiss
	} else if err != nil {
		log.Printf("cache: Get %s failed: %s", key, err)
		atomic.AddInt64(&cd.hits, 1)
		return err
	}

	if err := cd.Unmarshal(b, v); err != nil {
		log.Printf("cache: Unmarshal failed: %s", err)
		atomic.AddInt64(&cd.hits, 1)
		return err
	}

	if cd.Cache != nil {
		cd.Cache.Set(key, v)
	}

	atomic.AddInt64(&cd.hits, 1)
	return nil

}

func (cd *Codec) Delete(key string) error {
	if cd.Cache != nil {
		cd.Cache.Delete(key)
	}

	deleted, err := cd.Ring.Del(key).Result()
	if err != nil {
		log.Printf("cache: Del %s failed: %s", key, err)
		return err
	}
	if deleted == 0 {
		return ErrCacheMiss
	}
	return nil
}

func (cd *Codec) Hits() int {
	return int(atomic.LoadInt64(&cd.hits))
}

func (cd *Codec) Misses() int {
	return int(atomic.LoadInt64(&cd.misses))
}

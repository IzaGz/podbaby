package server

import (
	"github.com/Sirupsen/logrus"
	"github.com/justinas/alice"
	"net/http"
	"time"
)

type timerMiddleware struct {
	log     *logrus.Logger
	handler http.Handler
}

func newTimerMiddleware(logger *logrus.Logger) alice.Constructor {
	return func(handler http.Handler) http.Handler {
		return &timerMiddleware{
			logger,
			handler,
		}
	}
}

func (m *timerMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	start := time.Now()

	m.handler.ServeHTTP(w, r)

	logger := m.log.WithFields(logrus.Fields{
		"URL":    r.URL.Path,
		"Method": r.Method,
		"Time":   time.Since(start),
	})

	logger.Info()
}
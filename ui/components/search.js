import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  Grid,
  Row,
  Col,
  ButtonGroup,
  Button,
  Well,
  Input,
  Panel
} from 'react-bootstrap';

import  * as actions from '../actions';
import PodcastList from './podcasts';
import Image from './image';
import Icon from './icon';
import { sanitize, formatPubDate } from './utils';

const ChannelItem = props => {
  const { channel, subscribe } = props;
  const url = `/podcasts/channel/${channel.id}/`;

  return (
    <Panel>
    <div className="media">
      <div className="media-left">
        <Link to={url}>
        <Image className="media-object"
               src={channel.image}
               errSrc='/static/podcast.png'
               imgProps={{
               height:60,
               width:60,
               alt:channel.title }} />
        </Link>
      </div>
      <div className="media-body">
        <Grid>
          <Row>
            <Col xs={6} md={9}>
              <h4 className="media-heading"><Link to={url}>{channel.title}</Link></h4>
            </Col>
            <Col xs={6} md={3}>
              <ButtonGroup>
                <Button title={channel.isSubscribed ? "Unsubscribe" : "Subscribe"} onClick={subscribe}>
                  <Icon icon={channel.isSubscribed ? "unlink" : "link"} /> {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </div>
    </div>
  </Panel>
  );
};


export class Search extends React.Component {

  constructor(props) {
    super(props);
    const { search } = bindActionCreators(actions.search, this.props.dispatch);
    this.search = search;
  }

  componentDidMount() {
    const query = this.props.location.query.q || "";
    this.search(query);
  }

  handleSearch(event) {
    event.preventDefault();
    const value = this.refs.query.getValue();
    if (value) {
      this.search(value);
    }
  }

  handleFocus(event) {
    this.refs.query.getInputDOMNode().select();
  }

  render() {

    const { dispatch, channels, podcasts, searchQuery } = this.props;

    const ifEmptyMsg = (
      <span><b>Hint:</b> Try searching by category e.g. <em>music</em> or <em>science</em> or by name e.g. <em>Radio Lab</em></span>
    );

    return (
    <div>
      <form className="form" onSubmit={this.handleSearch.bind(this)}>

        <Input type="search"
               ref="query"
               onClick={this.handleFocus.bind(this)}
               placeholder="Find a channel or podcast" />
        <Button type="submit" bsStyle="primary" className="form-control">
          <Icon icon="search" /> Search
        </Button>
      </form>
      {channels.map(channel => {
        const subscribe = (event) => {
          event.preventDefault();
          const action = channel.isSubscribed ? actions.subscribe.unsubscribe : actions.subscribe.subscribe;
          dispatch(action(channel.id, channel.title));
        };
        return (
          <ChannelItem key={channel.id}
                       channel={channel}
                       subscribe={subscribe} />
        );
      })}
      {podcasts.length > 0 ? <hr /> : ''}
      {searchQuery ?
        <PodcastList actions={actions}
                     showChannel={true}
                     ifEmpty={ifEmptyMsg}
                      {...this.props} /> : '' }
    </div>
    );
  }
}

const mapStateToProps = state => {
  const { podcasts, showDetail, isLoading } = state.podcasts;
  const { query, channels } = state.search;
  return {
    searchQuery: query,
    podcasts: podcasts || [],
    channels: channels || [],
    showDetail,
    isLoading,
    player: state.player
  };
};

export default connect(mapStateToProps)(Search);

import * as React from 'react';
import isTouch from '../util/isTouch';

import ControlBar from './ControlBar';
import Canvas from './Canvas';

import {Store} from 'redux';
import {State} from '../records';
import {Subscriber} from '../runLoop';

export default class GameContainer extends React.Component<{}, {}> {
  componentDidMount() {
    if (isTouch) {
      window.addEventListener('resize', () => this.setLandscapeTouch());
      this.setLandscapeTouch();
    }
  }

  setLandscapeTouch() {
    if (this.isLandscapeTouch()) {
      document.body.classList.add('landscape-touch');
    } else {
      document.body.classList.remove('landscape-touch');
    }

    this.forceUpdate();
  }

  isLandscapeTouch() {
    return window.innerWidth > window.innerHeight && isTouch;
  }

  maybeRenderMobileHelp() {
    if (isTouch) {
      return (
        <p className="orientation-help-text mobile-only">
          (turn your phone sideways for a better view!)
        </p>
      );
    } else {
      return null;
    }
  }

  render() {
    let className = 'game-container';
    if (this.isLandscapeTouch()) {
      className += ' landscape-touch';
    }

    return (
      <div className={className}>
        <Canvas />
        <ControlBar />

        <div style={{clear: 'both'}} />

        {this.maybeRenderMobileHelp()}
      </div>
    );
  }
}
import tinycolor from 'tinycolor2';

import {
  WIDTH,
  HEIGHT,
  OVER_TIMER_MS,
} from '../../universal/constants';

import {
  State,
  LeaderboardPlayer,
} from '../records';

import toOrdinal from '../util/toOrdinal';

const beginCountingMs = 2500;
const endCountingMs = 3500;
const endSortingMs = 4500;

function renderLeaderboardPoints(
  ctx: CanvasRenderingContext2D, state: State, player: LeaderboardPlayer, pointsX: number,
  rowY: number, elapsedMs: number
) {
  if (player.addedPoints === 0) {
    // Don't bother with the animating adding points logic if we're not even rendering added points
    ctx.textAlign = 'right';
    ctx.fillText(`${player.prevPoints}`, pointsX, rowY);
    return;
  }

  if (beginCountingMs >= elapsedMs) {
    ctx.textAlign = 'right';
    ctx.fillText(`${player.prevPoints}`, pointsX, rowY);
    ctx.textAlign = 'left';
    ctx.fillText(`+${player.addedPoints}`, pointsX + 10, rowY);

  } else {
    // remove one point every 80ms
    let movedPoints = Math.floor((elapsedMs - beginCountingMs) / 50);

    if (movedPoints > player.addedPoints) {
      movedPoints = player.addedPoints;
    }

    const remainingPoints = player.addedPoints - movedPoints;
    const newPoints = player.prevPoints + movedPoints;

    ctx.textAlign = 'right';
    ctx.fillText(`${newPoints}`, pointsX, rowY);

    if (remainingPoints > 0) {
      ctx.textAlign = 'left';
      ctx.fillText(`+${remainingPoints}`, pointsX + 10, rowY);
    }
  }

}

export default function renderLeaderBoard(ctx: CanvasRenderingContext2D, state: State) {
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';

  const x = WIDTH / 2;
  const y = 55;

  if (state.round.roundRankedPlayers === null) {
    // player connected late and missed the levelOver message, display placeholder
    ctx.fillText('Waiting for next round....', x, HEIGHT / 2);
    return;

  } else if (state.round.roundRankedPlayers.every((player) => !player.scored)) {
    // no one finished
    ctx.fillText('No one wins!', x, HEIGHT / 2);
    return;
  }

  ctx.fillStyle = 'white';

  if (!state.isObserver) {
    ctx.font = 'normal 16px "Press Start 2P"';

    // can't use state.round.scored here because the round-end message can be sent before this is
    // computed locally due to lag
    const players = state.round.roundRankedPlayers;
    const idx = players.findIndex((player) => player.id === state.id);

    if (players.get(idx).scored) {
      ctx.fillText(`You placed ${toOrdinal(idx + 1)}`, WIDTH / 2, y);

    } else {
      ctx.fillText('You didn\'t make it in :(', WIDTH / 2, y);
    }
  }

  ctx.font = 'normal 8px "Press Start 2P"';

  const placeX = x - 200;
  const nameX = x - 180;
  const scoreX = x + 30;
  const timeX = x + 90;
  const pointsX = x + 160;

  // Draw header
  const headerY = y + 20;
  ctx.textAlign = 'left';
  ctx.fillText('Name', nameX, headerY);
  ctx.textAlign = 'right';
  ctx.fillText('Strokes', scoreX, headerY);
  ctx.fillText('Time', timeX, headerY);
  ctx.textAlign = 'right';
  ctx.fillText('Points', pointsX, headerY);

  // TODO: HOLY SHIT MEMOIZE THIS
  const matchRankedPlayers = state.round.roundRankedPlayers
    .sortBy((player) => player.prevPoints + player.addedPoints)
    .reverse()
    .toList();  // unnecessary at runtime but needed for TypeScript to know what type this is :(

  const startTime = state.round.expTime - OVER_TIMER_MS;
  const elapsedMs = Date.now() - startTime;

  state.round.roundRankedPlayers.forEach((player, roundPos) => {

    // TODO: this lookup sucks, combine with above memoization to map a map of {id => pos} or
    // something
    const matchPos = matchRankedPlayers.findIndex((matchPlayer) => matchPlayer.id === player.id);

    const roundRowY = y + 30 + roundPos * 12;
    const matchRowY = y + 30 + matchPos * 12;

    let rowY, pos;
    if (elapsedMs < endCountingMs) {
      pos = player.scored ? roundPos + 1 : '';
      rowY = roundRowY;
    } else if (elapsedMs > endSortingMs) {
      pos = matchPos + 1;
      rowY = matchRowY;
    } else {
      pos = matchPos + 1;

      const sortingElapsedMs = elapsedMs - endCountingMs;
      const progress = sortingElapsedMs / (endSortingMs - endCountingMs);
      rowY = roundRowY + ((matchRowY - roundRowY) * progress)
    }

    const strokes = player.scored ? `${player.strokes}` : '---';
    const elapsed = player.scored ? (player.scoreTime / 1000).toFixed(2) : '---';

    // Render place
    ctx.textAlign = 'left';
    ctx.fillText(pos, placeX, rowY);

    // Render name
    if (tinycolor(player.color).isDark()) {
      ctx.strokeText(player.name, nameX, rowY);
    }

    ctx.fillStyle = player.color;
    ctx.fillText(player.name, nameX, rowY);

    // Render strokes & time elapsed
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';

    ctx.fillText(strokes, scoreX, rowY);
    ctx.fillText(elapsed, timeX, rowY);

    // Render points
    renderLeaderboardPoints(ctx, state, player, pointsX, rowY, elapsedMs);
  });
}

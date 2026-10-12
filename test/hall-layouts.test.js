import test from 'node:test';
import assert from 'node:assert/strict';
import { HALL, LAYOUTS, SEAT_COUNT, seatPositions } from '../lib/hall-layouts.js';

test('every layout returns one entry per seat', () => {
  for (const name of Object.keys(LAYOUTS)) {
    assert.equal(seatPositions(name).length, SEAT_COUNT, name);
  }
});

test('active seats stay inside the hall and outside the stage', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const stage = layout.stage;
    for (const seat of seatPositions(name).filter(Boolean)) {
      assert.ok(seat.x > 0 && seat.x < HALL.width && seat.y > 0 && seat.y < HALL.height, `${name} out of hall`);
      if (stage) {
        const inside = seat.x > stage.x && seat.x < stage.x + stage.width && seat.y > stage.y && seat.y < stage.y + stage.height;
        assert.equal(inside, false, `${name} seat on stage`);
      }
    }
  }
});

test('free layout clears every seat and unknown layouts fall back to theatre', () => {
  assert.equal(seatPositions('free').filter(Boolean).length, 0);
  assert.deepEqual(seatPositions('nope'), seatPositions('theatre'));
});

test('every layout carries copy for the info panel', () => {
  for (const layout of Object.values(LAYOUTS)) {
    assert.ok(layout.name && layout.text && layout.capacity && layout.photo && layout.alt);
  }
});

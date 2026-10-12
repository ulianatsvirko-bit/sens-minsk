import test from 'node:test';
import assert from 'node:assert/strict';
import { ENTRANCES, PLAN, ROOMS, findRoom, polygonArea, roomCentre, toPoints } from '../lib/floor-plan.js';

test('every room stays inside the plan and has copy', () => {
  for (const room of ROOMS) {
    assert.ok(room.id && room.label && room.name && room.area && room.text, room.id);
    for (const [x, y] of room.shape) {
      assert.ok(x >= 0 && x <= PLAN.width && y >= 0 && y <= PLAN.height, `${room.id} out of plan`);
    }
  }
});

test('room ids are unique and rooms with photos describe them', () => {
  assert.equal(new Set(ROOMS.map((room) => room.id)).size, ROOMS.length);
  for (const room of ROOMS.filter((item) => item.photo)) assert.ok(room.alt, room.id);
});

test('the main hall matches the surveyed 24.5 m length and is the largest room', () => {
  const hall = findRoom('hall');
  const xs = hall.shape.map(([x]) => x);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 24.5) < 0.2);
  const largest = [...ROOMS].sort((a, b) => polygonArea(b.shape) - polygonArea(a.shape))[0];
  assert.equal(largest.id, 'hall');
});

test('polygonArea, roomCentre and toPoints do the geometry', () => {
  const square = [[0, 0], [2, 0], [2, 3], [0, 3]];
  assert.equal(polygonArea(square), 6);
  assert.deepEqual(roomCentre(square), { x: 1, y: 1.5 });
  assert.equal(toPoints(square, 10), '0.0,0.0 20.0,0.0 20.0,30.0 0.0,30.0');
});

test('findRoom falls back to the main hall and entrances sit on the outline', () => {
  assert.equal(findRoom('nope').id, 'hall');
  for (const door of ENTRANCES) {
    const onEdge = door.x === 0 || door.x === PLAN.width || door.y === 0 || door.y === PLAN.height;
    assert.ok(onEdge, door.label);
  }
});

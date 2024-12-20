import State from '../components/state.js';

function conflictTest() {
  const reactive = {
    foo: 'bar',
  };
  const nonReactive = {
    foo: 'qux',
  };

  try {
    new State(reactive, nonReactive);
    console.error('conflictTest failed');
  } catch (error) {
    console.error('conflictTest passed');
  }
}

function testValues() {
  const reactive = {
    foo: 'bar',
    nested: {
      hello: 'world',
    },
  };
  const nonReactive = {
    baz: 'qux',
    nested2: {
      bonjour: 'monde',
    },
  };
  const state = new State(reactive, nonReactive);

  if (state.foo !== 'bar') console.error('Test 1 failed');
  else console.error('testValues reactive passed');
  if (state.baz !== 'qux') console.error('Test 2 failed');
  else console.error('testValues nonreactive passed');
}

function testNestedValues() {
  const reactive = {
    foo: 'bar',
    nested: {
      hello: 'world',
    },
  };
  const nonReactive = {
    baz: 'qux',
    nested2: {
      bonjour: 'monde',
    },
  };
  const state = new State(reactive, nonReactive);

  if (state.nested.hello !== 'world') console.error('Test 3 failed');
  else console.error('testNestedValues reactive passed');
  if (state.nested2.bonjour !== 'monde') console.error('Test 4 failed');
  else console.error('testNestedValues non reactive passed');
}

function testOnWithReactive() {
  const reactive = {
    foo: 'bar',
  };
  const nonReactive = {
    too: 'qux',
  };
  const state = new State(reactive, nonReactive);
  state.on('foo', value => {
    if (value !== 'bow') {
      console.error('testOnWithReactive failed');
    } else {
      console.error('testOnWithReactive passed');
    }
  });
  state.foo = 'bow';
}

function testOnWithNonReactive() {
  const reactive = {
    foo: 'bar',
  };
  const nonReactive = {
    too: 'qux',
  };
  const state = new State(reactive, nonReactive);
  try {
    state.on('too', () => {
      console.error('.on non reactive triggered: failed');
    })
    console.error('testOnWithNonReactive failed');
  } catch (error) {
    console.error('testOnWithNonReactive passed');
  }
}

// testNestedReactive is a test on .on with a reactive nested property
function testNestedReactive() {
  const reactive = {
    nested: {
      hello: 'world',
    },
  };
  const state = new State(reactive);
  state.on('nested.hello', value => {
    if (value !== 'bow') {
      console.error('testNestedReactive failed');
    } else {
      console.error('testNestedReactive passed');
    }
  });
  state.nested.hello = 'bow';
}

function testAddPropertyValue() {
  const state = new State({
    faders: {
      pan: { left: 0, right: 100 },
    },
  });

  state.addProperty('faders.toto', 'waou');
  if (state.faders.toto === 'waou') console.log('testAddPropertyValue value OK');
  state.on('faders.toto', newValue => {
    if (newValue === 75) console.log('testAddPropertyValue event OK');
  });
  state.faders.toto = 75;
}

function testAddPropertyObject() {
  const state = new State({
    faders: {
      pan: { left: 0, right: 100 },
    },
  });

  state.addProperty('faders.volume', { min: 0, max: 100, value: 50 });
  state.on('faders.volume.value', newValue => {
    if (newValue === 75) console.log('testAddPropertyObject OK');
  });

  state.faders.volume.value = 75;
}

function testAddPropertyEvent() {
  const state = new State({
    faders: {
      pan: { left: 0, right: 100 },
    },
  });

  let flag = 4;

  state.on('faders.+', (value) => {
    if (value.max === 100) flag = 5;
  })

  state.on('faders.-', (value) => {
    if (value.max === 100) flag = 6;
  })

  state.addProperty('faders.volume', { min: 0, max: 100, value: 50 });
  if (flag === 5) console.log('testAddPropertyEvent on add OK')
  else console.log('testAddPropertyEvent on add KO');

  state.removeProperty('faders.volume');
  if (flag === 6) console.log('testAddPropertyEvent on remove OK')
  else console.log('testAddPropertyEvent on remove KO');
}

function testRemoveOneProperty() {
  const state = new State({
    faders: {
      pan: { left: 0, right: 100 },
    },
  });
  let flag = 2;

  state.on('faders.pan', pan => {
    if (!pan) flag = 5;
  })

  state.removeProperty('faders.pan');
  if (flag === 5) console.log('testRemoveOneProperty OK');
  else console.log('testRemoveOneProperty KO')
}


conflictTest();
testValues();
testNestedValues();
testOnWithReactive();
testOnWithNonReactive();
testNestedReactive();
testAddPropertyValue();
testAddPropertyObject();
testAddPropertyEvent();
testRemoveOneProperty();
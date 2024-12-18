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
    console.error('Test failed');
  } catch (error) {
    console.error('conflict test passed');
  }
}

function testState() {
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

  if (state.foo !== 'bar') {
    console.error('Test 1 failed');
  }
  if (state.baz !== 'qux') {
    console.error('Test 2 failed');
  }
  if (state.nested.hello !== 'world') {
    console.error('Test 3 failed');
  }
  if (state.nested2.bonjour !== 'monde') {
    console.error('Test 4 failed');
  }
}

function testOn() {
  const reactive = {
    foo: 'bar',
  };
  const nonReactive = {
    too: 'qux',
  };
  const state = new State(reactive, nonReactive);
  state.on('foo', value => {
    if (value !== 'bow') {
      console.error('Test on failed');
    } else {
      console.error('Test on passed');
    }
  });
  state.foo = 'bow';
}

function testOn2() {
  const reactive = {
    foo: 'bar',
  };
  const nonReactive = {
    too: 'qux',
  };
  const state = new State(reactive, nonReactive);
  try {
    state.on('too', value => {
      console.error('Test on nonreactive failed');
    })
    console.error('Test on nonreactive failed');
  } catch (error) {
    console.error('Test on nonreactive passed');
  }
}

conflictTest();
testState();
testOn();
testOn2();
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

conflictTest();
testValues();
testNestedValues();
testOnWithReactive();
testOnWithNonReactive();
testNestedReactive();
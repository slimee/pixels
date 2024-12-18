function testState() {
  const reactive = {
    foo: 'bar',
    nested: {
      hello: 'world',
    },
  };
  const nonReactive = {
    baz: 'qux',
    nested: {
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
  if (state.nested.bonjour !== 'monde') {
    console.error('Test 4 failed');
  }
}

export default {
  testState,
}
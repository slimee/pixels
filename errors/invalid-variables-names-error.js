export default class InvalidVariablesNamesError extends Error {
  constructor(invalidVariableNames) {
    super(`Invalid variable names: ${invalidVariableNames.join(', ')}`);
    this.invalidVariableNames = invalidVariableNames;
    this.name = 'InvalidVariablesNamesError';
  }
}
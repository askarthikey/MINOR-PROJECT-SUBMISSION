export type CodeCompletionValidationDetails = {
  blankResults: boolean[];
};

export type AsyncSorterZoneResults = {
  callStack: boolean[];
  microtasks: boolean[];
  macrotasks: boolean[];
  outputOrder: boolean[];
};

export type AsyncSorterValidationDetails = {
  zoneResults: AsyncSorterZoneResults;
};

export type ValidationDetails = {
  blankResults?: boolean[];
  zoneResults?: AsyncSorterZoneResults;
};

export type ValidationResult = {
  isCorrect: boolean | undefined;
  details?: ValidationDetails;
};

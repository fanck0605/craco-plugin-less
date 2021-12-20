import { styleRuleByName } from "../src/utils";

test("the style rule matcher can match the rules correctly", () => {
  const lessRule = { test: /\.less$/ };
  const lessModuleRule = { test: /\.module\.less$/ };
  const sassRule = { test: /\.(scss|sass)$/ };
  const sassModuleRule = { test: /\.module\.(scss|sass)$/ };

  const fileLoader = { loader: "file-loader" };

  const matchLessRule = styleRuleByName("less", false);
  const matchLessModuleRule = styleRuleByName("less", true);

  expect(matchLessRule(lessRule)).toEqual(true);

  expect(matchLessRule(lessModuleRule)).toEqual(false);
  expect(matchLessRule(sassRule)).toEqual(false);
  expect(matchLessRule(sassModuleRule)).toEqual(false);
  expect(matchLessRule(fileLoader)).toEqual(false);

  expect(matchLessModuleRule(lessModuleRule)).toEqual(true);

  expect(matchLessModuleRule(lessRule)).toEqual(false);
  expect(matchLessModuleRule(sassRule)).toEqual(false);
  expect(matchLessModuleRule(sassModuleRule)).toEqual(false);
  expect(matchLessModuleRule(fileLoader)).toEqual(false);
});

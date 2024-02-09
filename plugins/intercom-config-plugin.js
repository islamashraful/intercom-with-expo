const { withMainApplication, withPlugins } = require("@expo/config-plugins");

const withMainApplicationIntercomImport = (expoConfig) =>
  withMainApplication(expoConfig, (modConfig) => {
    const contents = modConfig.modResults.contents;
    const regex = /.*import com\.intercom\.reactnative\.IntercomModule.*/;
    const match = contents.match(regex);
    if (match) {
      return modConfig;
    }

    const startIndexOfClassKeyword = contents.indexOf("class MainApplication");
    if (startIndexOfClassKeyword < 0) {
      return modConfig;
    }

    const codeToInject = `// Injected by intercom custom plugin\nimport com.intercom.reactnative.IntercomModule\n\n`;
    modConfig.modResults.contents = `${contents.slice(
      0,
      startIndexOfClassKeyword
    )}${codeToInject}${contents.slice(startIndexOfClassKeyword)}`;
    return modConfig;
  });

const withMainApplicationIntercomInit = (expoConfig) =>
  withMainApplication(expoConfig, (modConfig) => {
    if (!expoConfig?.extra?.INTERCOM) {
      return modConfig;
    }

    const contents = modConfig.modResults.contents;
    const regex = /.*IntercomModule\.initialize.*/;
    const match = contents.match(regex);
    if (match) {
      return modConfig;
    }

    const soLoaderCode = `SoLoader.init(this, false)`;
    const startIndexForSoLoader = contents.indexOf(soLoaderCode);
    if (startIndexForSoLoader < 0) {
      return modConfig;
    }

    const endIndexOfSoLoader = startIndexForSoLoader + soLoaderCode.length;
    const codeToInject = `\n\n    // Injected by intercom custom plugin    \n    IntercomModule.initialize(this, "${expoConfig.extra.INTERCOM.androidApiKey}", "${expoConfig.extra.INTERCOM.appId}")\n`;
    modConfig.modResults.contents = `${contents.slice(
      0,
      endIndexOfSoLoader
    )}${codeToInject}${contents.slice(endIndexOfSoLoader)}`;
    return modConfig;
  });

module.exports = (expoConfig) => {
  return withPlugins(expoConfig, [
    [withMainApplicationIntercomImport],
    [withMainApplicationIntercomInit],
  ]);
};

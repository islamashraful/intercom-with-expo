const {
  withMainApplication,
  withPlugins,
  withAppDelegate,
} = require("@expo/config-plugins");

// Import intercom, insert following code on MainApplication.kt
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

// Init intercom, on MainApplication.kt inside onCreate function
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

// Import intercom on AppDelegate.mm
const withAppDelegateIntercomImport = (expoConfig) =>
  withAppDelegate(expoConfig, (modConfig) => {
    const contents = modConfig.modResults.contents;
    const match = contents.indexOf(`#import <IntercomModule.h>`);
    if (match > -1) {
      return modConfig;
    }

    const startIndexOfDelegateKeyword = contents.indexOf(
      "@implementation AppDelegate"
    );
    if (startIndexOfDelegateKeyword < 0) {
      return modConfig;
    }

    const codeToInject = `// Injected by intercom custom plugin\n#import <IntercomModule.h>\n\n`;
    modConfig.modResults.contents = `${contents.slice(
      0,
      startIndexOfDelegateKeyword
    )}${codeToInject}${contents.slice(startIndexOfDelegateKeyword)}`;
    return modConfig;
  });

// Init intercom on AppDelegate.mm inside didFinishLaunchingWithOptions
const withAppDelegateIntercomInit = (expoConfig) =>
  withAppDelegate(expoConfig, (modConfig) => {
    if (!expoConfig?.extra?.INTERCOM) {
      return modConfig;
    }

    const contents = modConfig.modResults.contents;
    const regex = /.*\[IntercomModule initialize.*/;
    const match = contents.match(regex);
    if (match) {
      return modConfig;
    }

    const initPropsCode = `self.initialProps = @{};`;
    const startIndexForInitProps = contents.indexOf(initPropsCode);
    if (startIndexForInitProps < 0) {
      return modConfig;
    }

    const endIndexOfInitProps = startIndexForInitProps + initPropsCode.length;
    const codeToInject = `\n  // Injected by intercom custom plugin\n  [IntercomModule initialize:@"${expoConfig.extra.INTERCOM.iosApiKey}" withAppId:@"${expoConfig.extra.INTERCOM.appId}"];`;
    modConfig.modResults.contents = `${contents.slice(
      0,
      endIndexOfInitProps
    )}${codeToInject}${contents.slice(endIndexOfInitProps)}`;
    return modConfig;
  });

module.exports = (expoConfig) => {
  return withPlugins(expoConfig, [
    [withMainApplicationIntercomImport],
    [withMainApplicationIntercomInit],
    [withAppDelegateIntercomImport],
    [withAppDelegateIntercomInit],
  ]);
};

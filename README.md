<div align="center">
  <h1 align="center">Custom Plugins for Expo Application</h1>
<div align="center">
A demonstration of writing custom mod-plugins to integrate intercom with an expo-managed application.<br/><br/>
</div>
This is the working repo of the <a href="https://imasharaful.medium.com/custom-plugins-for-expo-application-a17b7f889483">medium article</a> I wrote, which explained the power of Expo plugins and mods in detail. 
</div>

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Cloning the Repository**

```bash
git clone https://github.com/islamashraful/intercom-with-expo.git
cd intercom-with-expo
```

**Installation**

Install the project dependencies using yarn:

```bash
yarn
```

**Set Up App Configuration**

```json
...
 "extra": {
    "eas": {
        "projectId": "....."
    },
    "INTERCOM": {
        "androidApiKey": "android_sdk-YOUR-KEY",
        "appId": "YOUR_APP_ID",
        "iosApiKey": "ios_YOUR_KEY"
    }
}
```

Update the `INTERCOM` credentials with your own keys.
You can obtain your trial key by signing up on the [Intercom website](https://www.intercom.com/). Also update eas `projectId` with your own one.

**Create a Development Build**

```bash
# You can omit `--local` flag if you want a cloud build.

# for ios
eas build --profile development --platform ios --local
# for android
eas build --profile development --platform android --local
```

**Running the Project**

Open the android or ios build in the respective simulator and run following command.

```bash
npx expo start --dev-client
```

## <a name="quick-start">🤸 Using Intercom Config Plugin in Your Own App (Preferred Way!)</a>

1. Copy the plugins directory and put it in your app root directory
2. Update your `app.json` / `app.config.js` / `app.config.ts` with the credentials

```json
"extra": {
    ...
    "INTERCOM": {
        "androidApiKey": "android_sdk-YOUR-KEY",
        "appId": "YOUR_APP_ID",
        "iosApiKey": "ios_YOUR_KEY"
    }
    ...
}
```

3. Update your application code to see Intercom actions, like `App.js` from this repo

```jsx
...
useEffect(() => {
    Intercom.loginUnidentifiedUser();
}, []);

  return (
    <View style={styles.container}>
      <Button
        title="Open Intercom"
        onPress={() => {
          Intercom.present();
        }}
      />
...
```

4. Create a development build of your app, that's it!

## <a name="snippets">🕸️ Snippets</a>

<details>
<summary><code>intercom-config-plugin.js</code></summary>

```js
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
    const match = contents.indexOf(`import <IntercomModule.h>`);
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
```

</details>

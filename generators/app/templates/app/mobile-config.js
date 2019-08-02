/* globals App */
App.info({
    id: 'com.nubevtech.nbgen2-base',
    name: 'nbgen2Base',
    version: '0.0.1'
});

App.icons({
    // For IOS
    app_store: "resources/icon.png",
    iphone_2x: "resources/ios/icon/icon-60@2x.png",
    iphone_3x: "resources/ios/icon/icon-60@3x.png",
    ipad_2x: "resources/ios/icon/icon-76@2x.png",
    ipad_pro: "resources/ios/icon/icon-83.5@2x.png",
    ios_settings_2x: "resources/ios/icon/icon-small@2x.png",
    ios_settings_3x: "resources/ios/icon/icon-small@3x.png",
    ios_spotlight_2x: "resources/ios/icon/icon-40@2x.png",
    ios_spotlight_3x: "resources/ios/icon/icon-40@3x.png",
    ios_notification_2x: "resources/ios/icon/icon-40.png",
    ios_notification_3x: "resources/ios/icon/icon-60.png",
    ipad: "resources/ios/icon/icon-76.png",
    ios_settings: "resources/ios/icon/icon-small.png",
    ios_spotlight: "resources/ios/icon/icon-40.png",
    // ios_notification:
    iphone_legacy: "resources/ios/icon/icon.png",
    iphone_legacy_2x: "resources/ios/icon/icon@2x.png",
    ipad_spotlight_legacy: "resources/ios/icon/icon-50.png",                    // (50x50) Legacy
    ipad_spotlight_legacy_2x: "resources/ios/icon/icon-50@2x.png",              // (100x100) Legacy
    ipad_app_legacy: "resources/ios/icon/icon-72.png",                          // (72x72) Legacy
    ipad_app_legacy_2x: "resources/ios/icon/icon-72@2x.png",                    // (144x144) Legacy
    
    // For Android
    android_mdpi: "resources/android/icon/mipmap-mdpi/ic_launcher.png",         // (48x48)
    android_hdpi: "resources/android/icon/mipmap-hdpi/ic_launcher.png",         // (72x72)
    android_xhdpi: "resources/android/icon/mipmap-xhdpi/ic_launcher.png",       // (96x96)
    android_xxhdpi: "resources/android/icon/mipmap-xxhdpi/ic_launcher.png",     // (144x144)
    android_xxxhdpi: "resources/android/icon/mipmap-xxxhdpi/ic_launcher.png",   // (192x192)
});

App.launchScreens({
    // For IOS
    iphone5: "resources/ios/splash/Default-568h@2x~iphone.png",                 // (640x1136) // iPhone 5, SE
    iphone6: "resources/ios/splash/Default-667h.png",                           // (750x1334) // iPhone 6, 6s, 7, 8
    iphone6p_portrait: "resources/ios/splash/Default-736h.png",                 // (1242x2208) // iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus
    iphone6p_landscape: "resources/ios/splash/Default-Landscape-736h.png",      // (2208x1242) // iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus
    iphoneX_portrait: "resources/ios/splash/Default-2436h.png",                 // (1125x2436) // iPhone X
    iphoneX_landscape:  "resources/ios/splash/Default-Landscape-2436h.png",     // (2436x1125) // iPhone X
    ipad_portrait_2x: "resources/ios/splash/Default-Portrait@2x~ipad.png",      // (1536x2048) // iPad, iPad mini
    ipad_landscape_2x: "resources/ios/splash/Default-Landscape@2x~ipad.png",    // (2048x1536) // iPad, iPad mini
    iphone: "resources/ios/splash/Default~iphone.png",                          // (320x480) // Legacy
    iphone_2x: "resources/ios/splash/Default@2x~iphone.png",                    // (640x960) // Legacy
    ipad_portrait: "resources/ios/splash/Default-Portrait~ipad.png",            // (768x1024) // Legacy
    ipad_landscape: "resources/ios/splash/Default-Landscape~ipad.png",          // (1024x768) // Legacy

    // For Android
    android_mdpi_portrait: "resources/android/splash/drawable-port-mdpi-screen.png",        // (320x480)
    android_mdpi_landscape: "resources/android/splash/drawable-land-mdpi-screen.png",       // (480x320)
    android_hdpi_portrait: "resources/android/splash/drawable-port-hdpi-screen.png",        // (480x800)
    android_hdpi_landscape: "resources/android/splash/drawable-land-hdpi-screen.png",       // (800x480)
    android_xhdpi_portrait: "resources/android/splash/drawable-port-xhdpi-screen.png",      // (720x1280)
    android_xhdpi_landscape: "resources/android/splash/drawable-land-xhdpi-screen.png",     // (1280x720)
    android_xxhdpi_portrait: "resources/android/splash/drawable-port-xxhdpi-screen.png",    // (960x1600)
    android_xxhdpi_landscape: "resources/android/splash/drawable-land-xxhdpi-screen.png",   // (1600x960)
    android_xxxhdpi_portrait: "resources/android/splash/drawable-port-xxxhdpi-screen.png",  // (1280x1920)
    android_xxxhdpi_landscape: "resources/android/splash/drawable-land-xxxhdpi-screen.png", // (1920x1280)
});

App.accessRule('*', {
    'allows-arbitrary-loads-in-media': 'true',
    'allows-arbitrary-loads-in-web-content': 'true',
    'allows-local-networking': 'true',
})

// App.configurePlugin('phonegap-plugin-push', {
//     SENDER_ID: 741868091334
// });


// App.setPreference('xwalkVersion', '23');
App.setPreference('android-minSdkVersion', '19');
App.setPreference('android-targetSdkVersion', '29');
App.setPreference('AutoHideSplashScreen', 'true');
App.setPreference('SplashScreenDelay', '0', 'ios');
App.setPreference('FadeSplashScreenDuration', '0', 'ios');
App.setPreference('AllowInlineMediaPlayback', 'true', 'ios');
App.setPreference('MediaPlaybackRequiresUserAction', 'true', 'ios');
// App.setPreference('ShowSplashScreenSpinner', 'true');

// Status Bar
App.setPreference('StatusBarOverlaysWebView', 'false');
App.setPreference('StatusBarBackgroundColor', '#212121');
App.setPreference('StatusBarStyle', 'lightcontent');

// App.configurePlugin('cordova-plugin-googleplus', {
//     'REVERSED_CLIENT_ID': 'com.googleusercontent.apps.452026963792-mrmvlp38irfd8h3olie6d2oqvc2boejo'
// });

// App.appendToConfig(`<platform name="ios">
//     <config-file platform="ios" target="*-Info.plist" parent="NSPhotoLibraryUsageDescription">
//       <string>CBSTeq needs to access your photo library.</string>
//     </config-file>
//     <config-file platform="ios" target="*-Info.plist" parent="NSCameraUsageDescription">
//       <string>CBSTeq needs to access your camera.</string>
//     </config-file>
//   </platform>`);

App.appendToConfig(`
    <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
        <application android:usesCleartextTraffic="true" xmlns:android="http://schemas.android.com/apk/res/android"></application>
    </edit-config>
`);

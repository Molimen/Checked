package com.checked

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class KioskPackage : ReactPackage {
  override fun createNativeModules(rc: ReactApplicationContext): List<NativeModule> =
    listOf(KioskModule(rc))

  override fun createViewManagers(rc: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
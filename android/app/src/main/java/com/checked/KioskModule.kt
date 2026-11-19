package com.checked

import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.*

class KioskModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName() = "KioskModule"

  @ReactMethod
  fun enable(promise: Promise) {
    val activity = ctx.currentActivity
      ?: return promise.reject("NO_ACTIVITY", "No current activity")
    activity.runOnUiThread {
      try {
        val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        if (dpm.isDeviceOwnerApp(ctx.packageName)) {
          val admin = ComponentName(ctx, MyDeviceAdminReceiver::class.java)
          dpm.setLockTaskPackages(admin, arrayOf(ctx.packageName))
        }
        activity.startLockTask()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("ENABLE_FAILED", e)
      }
    }
  }

  @ReactMethod
  fun disable(promise: Promise) {
    val activity = ctx.currentActivity
      ?: return promise.reject("NO_ACTIVITY", "No current activity")
    activity.runOnUiThread {
      try {
        activity.stopLockTask()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("DISABLE_FAILED", e)
      }
    }
  }

  @ReactMethod
  fun isEnabled(promise: Promise) {
    val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    promise.resolve(am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE)
  }
}
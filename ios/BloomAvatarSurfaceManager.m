// UNVERIFIED: never compiled (no Mac); not linked or packed. See BloomAvatarSurface.swift.
#import <React/RCTViewManager.h>

#if __has_include("Bloom-Swift.h")
#import "Bloom-Swift.h"
#else
#import <Bloom/Bloom-Swift.h>
#endif

/// `BloomAvatarSurfaceV1`: the props and events of android/.../AvatarSurface.kt.
@interface BloomAvatarSurfaceManager : RCTViewManager
@end

@implementation BloomAvatarSurfaceManager

RCT_EXPORT_MODULE(BloomAvatarSurfaceV1)

- (UIView *)view
{
  return [[BloomAvatarSurfaceView alloc] initWithFrame:CGRectZero];
}

// `frame` is UIView's own geometry; the prop is stored as `frameData`.
RCT_REMAP_VIEW_PROPERTY(frame, frameData, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(loopKey, NSString)
RCT_EXPORT_VIEW_PROPERTY(loopTracks, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(loopClock, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(capture, double)
RCT_EXPORT_VIEW_PROPERTY(onLoop, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCapture, RCTDirectEventBlock)

@end

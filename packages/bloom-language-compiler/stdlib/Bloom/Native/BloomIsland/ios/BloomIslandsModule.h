// The `BloomIslands` native module (BloomIslandsModule.mm).
#import <React/RCTEventEmitter.h>

@interface BloomIslandsModule : RCTEventEmitter
/// Sends `BloomIslandEvent` ({ key, name, payload }) to JavaScript.
+ (void)emitEventWithKey:(NSString *)key name:(NSString *)name payload:(NSString *)payload;
@end

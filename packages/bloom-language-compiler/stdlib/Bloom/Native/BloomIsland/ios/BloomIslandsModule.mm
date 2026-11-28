// The `BloomIslands` native module, as Android's: `setProps(key, json)` and
// `setTheme(key, preset, scheme)` feed a keyed island's data and theme off React's commit
// (BloomUI's `BloomIslandStore`), and islands' events reach JavaScript as `DeviceEventEmitter`'s
// `BloomIslandEvent` ({ key, name, payload }), which Mention's FeedIslandList listens to.
//
// NOT BUILT YET: it needs the Mac lane, as BloomIslandComponentView.mm does.
#import "BloomIslandsModule.h"
#import "BloomIsland-Swift.h"

static __weak BloomIslandsModule *shared;

@implementation BloomIslandsModule {
  BOOL _listening;
}

RCT_EXPORT_MODULE(BloomIslands)

+ (BOOL)requiresMainQueueSetup { return YES; }

- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

- (instancetype)init
{
  if (self = [super init]) shared = self;
  return self;
}

- (NSArray<NSString *> *)supportedEvents { return @[ @"BloomIslandEvent" ]; }

- (void)startObserving { _listening = YES; }

- (void)stopObserving { _listening = NO; }

+ (void)emitEventWithKey:(NSString *)key name:(NSString *)name payload:(NSString *)payload
{
  BloomIslandsModule *module = shared;
  if (!module || !module->_listening) return;
  [module sendEventWithName:@"BloomIslandEvent" body:@{ @"key" : key ?: @"", @"name" : name, @"payload" : payload }];
}

RCT_EXPORT_METHOD(setProps:(NSString *)key json:(NSString *)json)
{
  [BloomIslandChannel setProps:key json:json];
}

RCT_EXPORT_METHOD(setTheme:(NSString *)key preset:(nullable NSString *)preset scheme:(nullable NSString *)scheme)
{
  [BloomIslandChannel setTheme:key preset:preset scheme:scheme];
}

@end

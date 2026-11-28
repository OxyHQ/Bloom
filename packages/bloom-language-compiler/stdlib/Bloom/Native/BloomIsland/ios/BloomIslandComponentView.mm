// The Fabric component that hosts a SwiftUI island in the React Native app (ADR 0003,
// "Interop during a migration"; docs/native-runtime-api.mdx, "Islands"): `BloomIsland`, with
// props `island`, `islandKey`, `props` (JSON), `themePreset` and `themeScheme`, the same view
// Android's host is. Its events go out through the `BloomIslands` module
// (BloomIslandsModule.mm) as `BloomIslandEvent` ({ key, name, payload }). Its spec is
// BloomIslandViewNativeComponent.ts, beside it; React Native's codegen writes the C++ props and
// the descriptor it uses.
//
// NOT BUILT YET: it needs the Mac lane (Xcode, React Native 0.88's iOS codegen over the spec)
// to compile; the Swift it hosts (BloomUI's `BloomIslandController`) type-checks on Linux.
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/BloomIslandSpec/ComponentDescriptors.h>
#import <react/renderer/components/BloomIslandSpec/Props.h>
#import <react/renderer/components/BloomIslandSpec/RCTComponentViewHelpers.h>
#import "BloomIsland-Swift.h"
#import "BloomIslandsModule.h"

using namespace facebook::react;

@interface BloomIslandComponentView : RCTViewComponentView <RCTBloomIslandViewProtocol>
@end

@implementation BloomIslandComponentView {
  BloomIslandController *_controller;
  NSString *_key;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BloomIslandComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const BloomIslandProps>();
    _props = defaultProps;
    _key = @"";
    _controller = [BloomIslandController new];
    __weak BloomIslandComponentView *weakSelf = self;
    _controller.onEvent = ^(NSString *name, NSString *payload) {
      BloomIslandComponentView *strongSelf = weakSelf;
      if (!strongSelf) return;
      [BloomIslandsModule emitEventWithKey:strongSelf->_key name:name payload:payload];
    };
    _controller.view.frame = self.bounds;
    _controller.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.contentView = _controller.view;
  }
  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  // The hosting controller joins the window's view controller tree, so SwiftUI's environment
  // (trait collection, safe area, presentation) is the app's.
  UIViewController *parent = self.window.rootViewController;
  if (self.window && parent && _controller.parentViewController == nil) {
    [parent addChildViewController:_controller];
    [_controller didMoveToParentViewController:parent];
  } else if (!self.window && _controller.parentViewController) {
    [_controller willMoveToParentViewController:nil];
    [_controller removeFromParentViewController];
  }
}

static NSString *str(const std::string &s) { return [NSString stringWithUTF8String:s.c_str()]; }

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<const BloomIslandProps>(props);
  _key = str(next.islandKey);
  [_controller updateWithName:str(next.island)
                          key:_key
                        props:str(next.props)
                       preset:str(next.themePreset)
                       scheme:str(next.themeScheme)];
  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> BloomIslandCls(void)
{
  return BloomIslandComponentView.class;
}

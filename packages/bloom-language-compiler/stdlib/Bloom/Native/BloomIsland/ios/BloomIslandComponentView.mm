// The Fabric component that hosts a SwiftUI island in the React Native app (ADR 0003,
// "Interop during a migration"; docs/native-runtime-api.mdx, "Islands"): `BloomIslandView`
// with props `island` (the registered name) and `props` (JSON), and the event `onEvent`
// ({ event: JSON }). Its spec is BloomIslandViewNativeComponent.ts, beside it; React
// Native's codegen writes the C++ props, the event emitter and the descriptor it uses.
//
// NOT BUILT YET: it needs the Mac lane (Xcode, React Native 0.88's iOS codegen over the spec)
// to compile; the Swift it hosts (BloomUI's `BloomIslandController`) type-checks on Linux.
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/BloomIslandSpec/ComponentDescriptors.h>
#import <react/renderer/components/BloomIslandSpec/EventEmitters.h>
#import <react/renderer/components/BloomIslandSpec/Props.h>
#import <react/renderer/components/BloomIslandSpec/RCTComponentViewHelpers.h>
#import "BloomIsland-Swift.h"

using namespace facebook::react;

@interface BloomIslandComponentView : RCTViewComponentView <RCTBloomIslandViewViewProtocol>
@end

@implementation BloomIslandComponentView {
  BloomIslandController *_controller;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BloomIslandViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const BloomIslandViewProps>();
    _props = defaultProps;
    _controller = [BloomIslandController new];
    __weak BloomIslandComponentView *weakSelf = self;
    _controller.onEvent = ^(NSString *event) {
      BloomIslandComponentView *strongSelf = weakSelf;
      if (!strongSelf || !strongSelf->_eventEmitter) return;
      std::static_pointer_cast<const BloomIslandViewEventEmitter>(strongSelf->_eventEmitter)
          ->onEvent(BloomIslandViewEventEmitter::OnEvent{.event = std::string([event UTF8String])});
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

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<const BloomIslandViewProps>(props);
  [_controller updateWithName:[NSString stringWithUTF8String:next.island.c_str()]
                        props:[NSString stringWithUTF8String:next.props.c_str()]];
  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> BloomIslandViewCls(void)
{
  return BloomIslandComponentView.class;
}

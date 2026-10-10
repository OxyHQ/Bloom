// Measures serialized rendered host trees with the Yoga shipped by React Native.
#include <yoga/Yoga.h>
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Intrinsic { float width; float height; };
YGSize measure(YGNodeConstRef node, float width, YGMeasureMode mode, float, YGMeasureMode) {
  const auto* size = static_cast<const Intrinsic*>(YGNodeGetContext(node));
  return {mode == YGMeasureModeExactly ? width : mode == YGMeasureModeAtMost
    ? std::min(width, size->width) : size->width, size->height};
}

void style(YGNodeRef node, const std::string& key, const std::string& value) {
  const auto number = [&] { return std::stof(value); };
  const auto length = [&](auto points, auto percent, auto automatic) {
    if (value == "auto") automatic(node);
    else if (value.ends_with('%')) percent(node, number());
    else points(node, number());
  };
  if (key == "width") length(YGNodeStyleSetWidth,YGNodeStyleSetWidthPercent,YGNodeStyleSetWidthAuto);
  else if (key == "height") length(YGNodeStyleSetHeight,YGNodeStyleSetHeightPercent,YGNodeStyleSetHeightAuto);
  else if (key == "minWidth") YGNodeStyleSetMinWidth(node,number());
  else if (key == "maxWidth") YGNodeStyleSetMaxWidth(node,number());
  else if (key == "minHeight") YGNodeStyleSetMinHeight(node,number());
  else if (key == "maxHeight") YGNodeStyleSetMaxHeight(node,number());
  else if (key == "flexGrow") YGNodeStyleSetFlexGrow(node,number());
  else if (key == "flexShrink") YGNodeStyleSetFlexShrink(node,number());
  else if (key == "flex") YGNodeStyleSetFlex(node,number());
  else if (key == "flexBasis") length(YGNodeStyleSetFlexBasis,YGNodeStyleSetFlexBasisPercent,YGNodeStyleSetFlexBasisAuto);
  else if (key == "flexDirection") YGNodeStyleSetFlexDirection(node,value=="row"?YGFlexDirectionRow:value=="row-reverse"?YGFlexDirectionRowReverse:value=="column-reverse"?YGFlexDirectionColumnReverse:YGFlexDirectionColumn);
  else if (key == "flexWrap") YGNodeStyleSetFlexWrap(node,value=="wrap"?YGWrapWrap:value=="wrap-reverse"?YGWrapWrapReverse:YGWrapNoWrap);
  else if (key == "justifyContent") YGNodeStyleSetJustifyContent(node,value=="center"?YGJustifyCenter:value=="flex-end"?YGJustifyFlexEnd:value=="space-between"?YGJustifySpaceBetween:value=="space-around"?YGJustifySpaceAround:value=="space-evenly"?YGJustifySpaceEvenly:YGJustifyFlexStart);
  else if (key == "alignItems" || key == "alignSelf" || key == "alignContent") {
    auto align=value=="center"?YGAlignCenter:value=="stretch"?YGAlignStretch:value=="flex-start"?YGAlignFlexStart:value=="flex-end"?YGAlignFlexEnd:value=="space-between"?YGAlignSpaceBetween:value=="space-around"?YGAlignSpaceAround:YGAlignAuto;
    if(key=="alignItems") YGNodeStyleSetAlignItems(node,align);
    else if(key=="alignSelf") YGNodeStyleSetAlignSelf(node,align);
    else YGNodeStyleSetAlignContent(node,align);
  } else if (key == "gap" || key == "rowGap" || key == "columnGap") YGNodeStyleSetGap(node,key=="gap"?YGGutterAll:key=="rowGap"?YGGutterRow:YGGutterColumn,number());
  else if(key=="position") YGNodeStyleSetPositionType(node,value=="absolute"?YGPositionTypeAbsolute:YGPositionTypeRelative);
  else if(key=="overflow") YGNodeStyleSetOverflow(node,value=="hidden"?YGOverflowHidden:value=="scroll"?YGOverflowScroll:YGOverflowVisible);
  else {
    const std::vector<std::pair<std::string,YGEdge>> edges={{"",YGEdgeAll},{"Horizontal",YGEdgeHorizontal},{"Vertical",YGEdgeVertical},{"Left",YGEdgeLeft},{"Right",YGEdgeRight},{"Top",YGEdgeTop},{"Bottom",YGEdgeBottom},{"Start",YGEdgeStart},{"End",YGEdgeEnd}};
    for(const auto& [suffix,edge]:edges) {
      if(key=="padding"+suffix) { YGNodeStyleSetPadding(node,edge,number()); return; }
      if(key=="margin"+suffix) { YGNodeStyleSetMargin(node,edge,number()); return; }
      if(key=="border"+suffix+"Width") { YGNodeStyleSetBorder(node,edge,number()); return; }
    }
    if(key=="top"||key=="bottom"||key=="left"||key=="right") YGNodeStyleSetPosition(node,key=="top"?YGEdgeTop:key=="bottom"?YGEdgeBottom:key=="left"?YGEdgeLeft:YGEdgeRight,number());
    else { std::cerr << "Unsupported layout property " << key << '\n'; std::exit(1); }
  }
}

int main() {
  int count,rtl;std::cin>>count>>rtl;
  auto config=YGConfigNew();YGConfigSetUseWebDefaults(config,false);
  // YogaLayoutableShadowNode uses compatibility errata by default in RN.
  YGConfigSetErrata(config,YGErrataAll);YGConfigSetPointScaleFactor(config,0);
  std::vector<YGNodeRef> nodes;std::vector<Intrinsic> intrinsic(count);
  for(int i=0;i<count;i++) {
    int parent,properties;float width,height;std::cin>>parent>>width>>height>>properties;
    auto node=YGNodeNewWithConfig(config);nodes.push_back(node);
    if(parent>=0)YGNodeInsertChild(nodes[parent],node,YGNodeGetChildCount(nodes[parent]));
    if(width>=0) { intrinsic[i]={width,height};YGNodeSetContext(node,&intrinsic[i]);YGNodeSetMeasureFunc(node,measure); }
    for(int p=0;p<properties;p++){std::string key,value;std::cin>>key>>value;style(node,key,value);}
  }
  YGNodeCalculateLayout(nodes[0],YGUndefined,YGUndefined,rtl?YGDirectionRTL:YGDirectionLTR);
  for(auto node:nodes)std::cout<<YGNodeLayoutGetLeft(node)<<' '<<YGNodeLayoutGetTop(node)<<' '<<YGNodeLayoutGetWidth(node)<<' '<<YGNodeLayoutGetHeight(node)<<'\n';
  YGNodeFreeRecursive(nodes[0]);YGConfigFree(config);
}

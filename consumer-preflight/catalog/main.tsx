import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {View,Text} from 'react-native';
import {BloomProvider} from '@oxy.so/bloom/provider';
import {TextFieldInput} from '@oxy.so/bloom/text-field';
import {MapControls,MapLayerPicker} from '@oxy.so/bloom/map-controls';
import {AgentChat} from '@oxy.so/bloom/agent-chat';
import {Workspace} from './workspace';
import {Canvas} from './canvas';
import './style.css';
function Document(){const [text,setText]=useState('Initial document');return <View><TextFieldInput label="Document draft" value={text} onValueChange={setText}/>{Array.from({length:30},(_,i)=><Text key={i}>Document paragraph {i+1}: synthetic local content.</Text>)}</View>}
function Inspector(){const [text,setText]=useState('Initial inspector');return <TextFieldInput label="Inspector note" value={text} onValueChange={setText}/>}
function Board(){const [zoom,setZoom]=useState(1),[following,setFollowing]=useState(false),[tilted,setTilted]=useState(false),[heading,setHeading]=useState(30),[layer,setLayer]=useState('standard'),[point,setPoint]=useState({x:0,y:0});return <div style={{flex:1,position:'relative',background:'#d7e9dc',minHeight:0}} onPointerDown={e=>{if(e.target===e.currentTarget)setPoint({x:Math.round(e.nativeEvent.offsetX),y:Math.round(e.nativeEvent.offsetY)})}}><div role="status">Zoom {zoom}; follow {String(following)}; tilt {String(tilted)}; layer {layer}; point {point.x},{point.y}</div><div style={{position:'absolute',right:20,top:45}}><MapControls onLocate={()=>setFollowing(!following)} following={following} heading={heading} onResetNorth={()=>setHeading(0)} onZoomIn={()=>setZoom(zoom+1)} onZoomOut={()=>setZoom(zoom-1)} tilted={tilted} onTiltChange={setTilted}><MapLayerPicker layers={[{id:'standard',label:'Standard'},{id:'satellite',label:'Satellite'}]} layerId={layer} onLayerChange={setLayer}/></MapControls></div></div>}
function Chat(){const [busy,setBusy]=useState(false),[messages,setMessages]=useState<{id:string;role:'user'|'assistant';text:string}[]>([]);return <AgentChat messages={messages} status={busy?'streaming':'ready'} onSubmit={text=>{setMessages([...messages,{id:String(messages.length),role:'user',text}]);setBusy(true)}} onStop={()=>{setBusy(false);setMessages(m=>[...m,{id:String(m.length),role:'assistant',text:'Stopped locally.'}])}}/>}
const task=new URLSearchParams(location.search).get('task')??'workspace';
createRoot(document.getElementById('root')!).render(<BloomProvider locale="en" mode="light"><View style={{flex:1,minHeight:0}}>{task==='workspace'?<Workspace document={<Document/>} inspector={<Inspector/>}/>:task==='canvas'?<Canvas canvas={<Board/>}/>:<Chat/>}</View></BloomProvider>);

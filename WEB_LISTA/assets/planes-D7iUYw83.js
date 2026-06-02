import{c as o}from"./index-BItsTWi9.js";/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=o("BarChart",[["line",{x1:"12",x2:"12",y1:"20",y2:"10",key:"1vz5eb"}],["line",{x1:"18",x2:"18",y1:"20",y2:"4",key:"cun8e5"}],["line",{x1:"6",x2:"6",y1:"20",y2:"16",key:"hq0ia6"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=o("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=o("Headphones",[["path",{d:"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",key:"1xhozi"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=o("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=o("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=o("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]),r={BASICO:{id:"basico",nombre:"Plan Básico",precio:1500,subtitulo:"Ideal para comenzar a digitalizar y ordenar tu operación de seguridad",limite_guardias:50,botones_panico:30,limite_puestos:1/0,historial_dias:180,beneficios:["Control básico de asistencia y operaciones","Registro de eventos con evidencia","Rondas QR básicas por puntos de control"],color:"#00d2ff"},PROFESIONAL:{id:"profesional",nombre:"Plan Profesional",precio:3e3,subtitulo:"Control total de tu operación con Rondas QR y Monitoreo GPS",limite_guardias:120,botones_panico:100,limite_puestos:1/0,historial_dias:180,gps:!0,rondas:!0,geocercas:!0,alertas_ia:!1,app_movil:!0,color:"#3b82f6",beneficios:["Monitoreo GPS en tiempo real","Rondas QR avanzadas con evidencia","Alertas ante desvíos operativos","Mejora en la calidad del servicio"]},ENTERPRISE:{id:"enterprise",nombre:"Plan Enterprise",precio:5e3,subtitulo:"Solución avanzada con IA, Rondas QR y Monitoreo Centralizado",limite_guardias:200,botones_panico:180,limite_puestos:1/0,historial_dias:365,gps:!0,rondas:!0,geocercas:!0,alertas_ia:!0,app_movil:!0,color:"#8b5cf6",beneficios:["IA para detección de eventos críticos","Rondas QR masivas multidispositivo","Auditoría completa de patrullajes","Supervisión centralizada avanzada"]},DEMO:{id:"demo",nombre:"Plan Demo",precio:0,subtitulo:"Probá el sistema completo sin compromiso",duracion_dias:15,limite_guardias:250,botones_panico:180,limite_puestos:1/0,historial_dias:365,gps:!0,rondas:!0,geocercas:!0,alertas_ia:!0,app_movil:!0,color:"#10b981",beneficios:["Acceso completo a todas las funciones","Simulación de operación real","Evaluación sin compromiso"]}},l=()=>{try{const e=localStorage.getItem("centinela_planes_data");if(e)return JSON.parse(e)}catch(e){console.error("Error loading planes from localStorage",e)}return r},a=l(),h=e=>{const i=(e||"basico").toLowerCase(),n=Object.values(a).find(t=>{var s;return((s=t.id)==null?void 0:s.toLowerCase())===i});return n||(i==="pro"?a.PROFESIONAL:a.BASICO)};export{d as B,p as D,u as H,a as P,m as S,v as T,y as a,h as g};

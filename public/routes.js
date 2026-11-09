/* Journeys drawn as constellations on the map, plus each place's terrain "personality".
   stops: [name, lat, lng, days]   loop: return to the first stop
   look:  how dense the hand-drawn terrain is around the route (0-1)
   lakes: [lat, lng, rx(deg), ry(deg), rotation(deg)]   rivers: [[lat,lng],...]   patches: [kind, lat, lng, r(deg)] */
window.ROUTES = {
 ladakh:{loop:true,stops:[['Leh',34.164,77.585,'Days 1–2'],['Khardung La',34.278,77.604,'Day 3'],['Nubra Valley',34.58,77.5,'Days 3–4'],['Turtuk',34.847,76.826,'Day 5'],['Pangong Tso',33.96,78.42,'Days 6–7'],['Hanle',32.779,78.973,'Day 8'],['Tso Moriri',32.92,78.30,'Day 9']],
  look:{mtn:1,snow:.6,dune:.35,tree:0,rock:.8},lakeColor:'#4fbfc6',
  lakes:[[33.83,78.62,.4,.065,-38],[32.9,78.31,.07,.12,10],[33.1,78.0,.05,.04,0]],
  rivers:[[[32.6,79.3],[33.0,78.6],[33.55,77.95],[34.0,77.75],[34.16,77.58],[34.4,77.0],[34.75,76.3]],[[34.05,78.2],[34.3,77.9],[34.55,77.6],[34.75,77.15],[34.9,76.7]]],
  patches:[['dune',34.57,77.45,.22],['dune',34.64,77.66,.14],['snow',34.9,77.9,.3],['snow',33.3,77.4,.25]]},
 patagonia:{loop:true,stops:[['Punta Arenas',-53.16,-70.91,'Day 1'],['Puerto Natales',-51.73,-72.51,'Day 2'],['Base Torres',-50.94,-72.97,'Day 3'],['Grey Glacier',-51.0,-73.2,'Day 4'],['Lago Pehoé',-51.08,-73.06,'Day 6'],['Milodon Cave',-51.57,-72.62,'Day 7']],
  look:{mtn:.9,snow:.6,dune:0,tree:.25,rock:.4},
  lakes:[[-51.07,-73.05,.06,.05,0],[-51.05,-72.9,.12,.03,-20],[-51.0,-72.75,.08,.05,0],[-51.05,-73.25,.03,.1,10]],
  rivers:[],patches:[['snow',-50.9,-73.4,.35],['snow',-51.3,-73.6,.3]]},
 lofoten:{loop:true,stops:[['Leknes',68.15,13.61,'Day 1'],['Reine',67.93,13.09,'Day 2'],['Hamnøy',67.94,13.13,'Day 2'],['Kvalvika',68.07,13.03,'Day 3'],['Henningsvær',68.15,14.2,'Day 4'],['Svolvær',68.23,14.57,'Day 5']],
  look:{mtn:.8,snow:.4,dune:0,tree:.05,rock:.6},lakes:[],rivers:[],patches:[]},
 kyoto:{loop:true,stops:[['Kyoto',34.985,135.758,'Day 1'],['Fushimi Inari',34.967,135.773,'Day 2'],['Arashiyama',35.009,135.667,'Day 3'],['Ryoan-ji',35.034,135.718,'Day 4'],['Nara',34.685,135.805,'Day 5'],['Nishiki Market',35.005,135.765,'Day 6'],['Ginkaku-ji',35.027,135.798,'Day 7']],
  look:{mtn:.35,snow:0,dune:0,tree:.9,rock:.1},lakes:[[35.25,136.07,.12,.28,20]],rivers:[[[35.1,135.75],[34.98,135.74],[34.88,135.7],[34.8,135.55]]],patches:[]},
 rajasthan:{loop:false,stops:[['Jaipur',26.91,75.79,'Days 1–2'],['Jodhpur',26.24,73.02,'Day 3'],['Desert camp',26.91,70.91,'Day 4'],['Udaipur',24.58,73.71,'Days 5–7']],
  look:{mtn:.25,snow:0,dune:.85,tree:.12,rock:.3},lakes:[[24.57,73.68,.04,.06,0],[24.6,73.7,.03,.02,0]],rivers:[],patches:[['dune',27,70.6,.9],['dune',26.3,71.4,.6]]},
 santorini:{loop:true,stops:[['Fira',36.416,25.432,'Day 1'],['Oia',36.461,25.375,'Day 2'],['Pyrgos vineyards',36.383,25.45,'Day 3'],['Akrotiri',36.351,25.403,'Day 3'],['Nea Kameni',36.404,25.396,'Day 4']],
  look:{mtn:.2,snow:0,dune:0,tree:.05,rock:.6},lakes:[],rivers:[],patches:[]},
 maldives:{loop:true,stops:[['Malé',4.175,73.509,'Day 1'],['Baa Atoll',5.17,73.13,'Days 2–3'],['Sandbank',5.25,73.0,'Day 4']],
  look:{mtn:0,snow:0,dune:0,tree:.2,rock:0},lakes:[],rivers:[],patches:[],
  atolls:[[4.3,73.45,.35,.5],[5.15,73.05,.28,.35],[3.9,73.4,.2,.25],[5.8,73.3,.3,.4],[3.45,72.85,.25,.3],[2.9,73.55,.2,.3],[4.75,73.4,.12,.15]]},
 iceland:{loop:false,stops:[['Reykjavík',64.146,-21.94,'Day 1'],['Gullfoss',64.327,-20.12,'Day 1'],['Skógafoss',63.532,-19.511,'Day 2'],['Reynisfjara',63.404,-19.045,'Day 2'],['Sólheimajökull',63.53,-19.37,'Day 3'],['Jökulsárlón',64.048,-16.18,'Day 4'],['Blue Lagoon',63.88,-22.449,'Day 5']],
  look:{mtn:.55,snow:.5,dune:0,tree:0,rock:.7},lakes:[[64.05,-16.2,.04,.05,0],[64.15,-21.1,.12,.06,0]],rivers:[],patches:[['snow',64.4,-16.8,.9],['snow',64.7,-18.9,.3],['snow',63.65,-19.15,.25]]},
 serengeti:{loop:true,stops:[['Arusha',-3.387,36.683,'Day 1'],['Seronera',-2.45,34.82,'Day 2'],['Migration route',-1.57,34.88,'Day 3'],['Ngorongoro Crater',-3.2,35.5,'Day 5'],['Maasai village',-3.0,35.65,'Day 6']],
  look:{mtn:.2,snow:0,dune:0,tree:.3,rock:.15,acacia:.8},lakes:[[-1.2,33.0,1.4,1.2,0],[-3.6,35.82,.08,.18,0],[-2.4,36.0,.08,.2,0]],rivers:[[[-2.0,35.2],[-1.8,34.6],[-1.6,34.0]]],patches:[['crater',-3.2,35.5,.11]]},
 bali:{loop:false,stops:[['Ubud',-8.507,115.262,'Days 1–3'],['Tirta Empul',-8.415,115.315,'Day 2'],['Tegenungan',-8.575,115.29,'Day 3'],['Uluwatu',-8.829,115.085,'Day 4'],['Padang Padang',-8.811,115.103,'Day 5'],['Nusa Penida',-8.751,115.474,'Day 6']],
  look:{mtn:.35,snow:0,dune:0,tree:.95,rock:.1,rice:.7},lakes:[[-8.25,115.4,.03,.05,0]],rivers:[],patches:[['volcano',-8.342,115.508,.08],['volcano',-8.242,115.375,.06]]},
 peru:{loop:false,stops:[['Cusco',-13.532,-71.968,'Day 1'],['Pisac',-13.42,-71.85,'Day 2'],['Ollantaytambo',-13.258,-72.263,'Day 2'],['Aguas Calientes',-13.155,-72.525,'Day 3'],['Machu Picchu',-13.163,-72.545,'Day 4'],['Rainbow Mountain',-13.869,-71.303,'Day 5'],['Lima',-12.046,-77.043,'Day 6']],
  look:{mtn:.95,snow:.3,dune:.1,tree:.4,rock:.4},lakes:[[-15.8,-69.4,.55,.3,-30]],rivers:[[[-14.0,-71.2],[-13.6,-71.7],[-13.3,-72.1],[-13.15,-72.55],[-12.6,-73.0]]],patches:[['snow',-13.4,-71.7,.15],['snow',-13.85,-71.2,.15]]},
 morocco:{loop:false,stops:[['Marrakech',31.63,-7.99,'Day 1'],['Atlas Mountains',31.137,-7.92,'Day 2'],['Aït Benhaddou',31.047,-7.13,'Day 3'],['Merzouga',31.08,-4.01,'Day 4'],['Fes',34.033,-5.0,'Day 5'],['Chefchaouen',35.171,-5.27,'Day 6'],['Tangier',35.76,-5.83,'Day 7']],
  look:{mtn:.6,snow:.15,dune:.6,tree:.15,rock:.5},lakes:[],rivers:[],patches:[['dune',31.1,-3.98,.25],['snow',31.06,-7.9,.12]]},
 newzealand:{loop:false,stops:[['Queenstown',-45.031,168.663,'Day 1'],['Milford Sound',-44.641,167.897,'Day 2'],['Glenorchy',-44.851,168.389,'Day 3'],['Wanaka',-44.7,169.13,'Day 4'],['Aoraki / Mt Cook',-43.735,170.096,'Day 5'],['Lake Tekapo',-44.004,170.477,'Day 6'],['Christchurch',-43.532,172.636,'Day 7']],
  look:{mtn:.9,snow:.5,dune:0,tree:.45,rock:.4},lakes:[[-45.05,168.6,.03,.28,-30],[-44.6,169.15,.04,.2,10],[-43.95,170.5,.03,.12,0],[-44.15,170.18,.03,.12,0]],rivers:[],patches:[['snow',-43.6,170.2,.35]]}
};

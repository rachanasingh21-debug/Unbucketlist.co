/* Wild things to spot near each journey: shown as little flags on the map and on each destination page.
   [emoji, name, lat, lng, where, why it's special, best time] */
window.WILDLIFE = {
 ladakh:[
  ['🐆','Snow leopard',33.95,77.45,'Hemis National Park','Ladakh’s state animal. Winter treks in Hemis give some of the best chances anywhere to glimpse one.','Jan–Mar'],
  ['🐦','Black-necked crane',33.3,77.98,'Changthang, around Tso Kar and Hanle','Ladakh’s state bird. Only a few dozen pairs breed in India, almost all on this plateau.','May–Sep'],
  ['🫏','Kiang (Tibetan wild ass)',32.98,78.42,'Near Tso Moriri','Herds of wild asses run across the open Changthang plateau.','Jun–Sep'],
  ['🐫','Bactrian camel',34.585,77.47,'Hunder dunes, Nubra','Double-humped camels, descended from Silk Road caravans, wander the dunes.','Year-round'],
  ['🐿️','Himalayan marmot',34.05,78.05,'On the way to Pangong','Plump, fearless marmots pop out of burrows beside the road.','May–Sep']],
 patagonia:[
  ['🐆','Puma',-50.98,-72.85,'Torres del Paine','One of the best places on Earth to see a wild puma.','Year-round'],
  ['🦙','Guanaco',-51.05,-72.68,'The Patagonian steppe','Wild cousins of the llama, grazing in herds across the park.','Year-round'],
  ['🦅','Andean condor',-50.92,-73.12,'Above the Paine massif','Among the largest flying birds, riding the Patagonian wind.','Year-round'],
  ['🐧','Magellanic penguin',-52.92,-70.58,'Isla Magdalena, near Punta Arenas','Tens of thousands nest on this small island each summer.','Oct–Mar']],
 lofoten:[
  ['🦅','White-tailed sea eagle',68.2,14.35,'The Trollfjord and around','Northern Europe’s largest eagle, with a wingspan over two metres.','Year-round'],
  ['🐋','Orca',68.05,14.85,'The Vestfjord','In winter, orcas follow the herring into the fjords.','Nov–Feb'],
  ['🐦','Atlantic puffin',67.5,12.05,'Røst and Værøy, the outer islands','Puffin colonies on the far tip of the archipelago.','May–Aug']],
 kyoto:[
  ['🦌','Sika deer',34.685,135.843,'Nara Park','More than a thousand free-roaming deer, some of which bow for crackers.','Year-round'],
  ['🐒','Japanese macaque',35.011,135.675,'Iwatayama Monkey Park, Arashiyama','Wild monkeys on a hilltop with a view over the whole city.','Year-round'],
  ['🐦','Grey heron',35.02,135.771,'The Kamo River','Herons fish the shallows right in the middle of the city.','Year-round']],
 rajasthan:[
  ['🐦','Demoiselle cranes',27.13,72.42,'Khichan village','Over 20,000 cranes spend the winter in one village, fed by its people.','Sep–Mar'],
  ['🐦','Great Indian bustard',26.75,70.6,'Desert National Park, Jaisalmer','One of the world’s rarest birds; most of the last few live in Rajasthan.','Oct–Mar'],
  ['🦌','Blackbuck',26.15,73.08,'Bishnoi villages near Jodhpur','Antelope protected for centuries by the Bishnoi community.','Year-round'],
  ['🐅','Bengal tiger',26.02,76.5,'Ranthambore, a drive from Jaipur','Tigers prowl among the ruins of an old fort.','Oct–Jun']],
 santorini:[
  ['🦅','Eleonora’s falcon',36.437,25.418,'The caldera cliffs','These falcons nest late, timing their chicks to the autumn bird migration.','Jun–Oct']],
 maldives:[
  ['🦈','Manta rays',5.17,73.15,'Hanifaru Bay, Baa Atoll','Hundreds of mantas can gather to feed in this tiny bay.','Jun–Nov'],
  ['🦈','Whale shark',3.48,72.83,'South Ari Atoll','One of the few places to meet whale sharks all year.','Year-round'],
  ['🐢','Sea turtles',4.3,73.42,'The house reefs','Green and hawksbill turtles graze the reefs.','Year-round']],
 iceland:[
  ['🐦','Atlantic puffin',63.4,-19.13,'Dyrhólaey, near Vík','Puffins nest on the sea cliffs every summer.','May–Aug'],
  ['🦭','Seals',64.05,-16.15,'Jökulsárlón ice lagoon','Seals hunt among the drifting icebergs.','Year-round'],
  ['🦊','Arctic fox',63.95,-19.7,'The south coast','Iceland’s only native land mammal.','Year-round']],
 serengeti:[
  ['🐃','Wildebeest migration',-1.6,34.9,'The northern Serengeti','Over a million wildebeest on the move, following the rains.','Jul–Oct'],
  ['🦁','Lions',-2.45,34.85,'Seronera','The heart of the park, famous for its lions.','Year-round'],
  ['🦏','Black rhino',-3.18,35.58,'Ngorongoro Crater','One of the best places in Tanzania to see this rare rhino.','Year-round'],
  ['🐆','Cheetah',-2.9,35.0,'The southern plains','Open grassland where cheetahs hunt by day.','Dec–Mar']],
 bali:[
  ['🐦','Bali myna',-8.13,114.5,'West Bali National Park','A snow-white starling found only on Bali, and one of the rarest birds on Earth.','Year-round'],
  ['🐒','Long-tailed macaque',-8.829,115.09,'Uluwatu temple','Cheeky temple monkeys, famous for stealing sunglasses.','Year-round'],
  ['🐟','Mola mola (ocean sunfish)',-8.716,115.46,'Crystal Bay, Nusa Penida','Giant sunfish rise to the reef in the cold-water season.','Jul–Oct'],
  ['🦈','Manta rays',-8.795,115.53,'Manta Point, Nusa Penida','Reef mantas circle the cleaning stations.','Year-round']],
 peru:[
  ['🐦','Andean cock-of-the-rock',-13.15,-72.51,'Cloud forest below the citadel','Peru’s flaming-orange national bird.','Oct–Apr'],
  ['🐇','Viscacha',-13.163,-72.548,'Machu Picchu','Rabbit-like rodents that sunbathe on the Inca walls.','Year-round'],
  ['🦙','Vicuña',-13.87,-71.3,'The high pastures by Rainbow Mountain','Wild cousins of the alpaca, with some of the finest wool in the world.','Year-round']],
 morocco:[
  ['🐒','Barbary macaque',33.5,-5.15,'Cedar forests of Ifrane, near Fes','Africa’s only macaques live in these mountain forests.','Year-round'],
  ['🐦','White storks',31.62,-7.98,'Marrakech','Storks nest on the old city walls.','Feb–Aug'],
  ['🦊','Fennec fox',31.15,-3.95,'Around the Erg Chebbi dunes','Tiny big-eared foxes come out at night.','Year-round']],
 newzealand:[
  ['🦜','Kea',-44.765,168.02,'Homer Tunnel, Milford Road','The world’s only alpine parrot: curious, clever and fond of car wipers. Please don’t feed them.','Year-round'],
  ['🐧','Tawaki (Fiordland penguin)',-44.62,167.85,'Milford Sound','One of the rarest penguins in the world nests along the fjords.','Jul–Nov'],
  ['🐬','Hector’s dolphin',-43.8,172.97,'Akaroa Harbour, near Christchurch','One of the smallest dolphins on Earth, found only in New Zealand.','Nov–Apr']]
};

/* Cardume · base de conhecimento de peixes (foco: litoral e águas interiores do Sudeste, começando pelo RJ).
   Cada espécie tem: família, nome no RJ, outros nomes no Brasil, nome em inglês, ambiente e
   CHAVES DIAGNÓSTICAS — os traços visíveis que a separam das espécies parecidas.
   A identificação usa essas chaves para comparar candidatos em vez de "chutar" um nome. */
(function (root) {
  const F = {
    Carangidae: 'Carangídeos (xaréus, xereletes, pampos, galos, olhetes)',
    Centropomidae: 'Robalos', Sciaenidae: 'Cienídeos (corvinas, pescadas, papa-terras)', Pomatomidae: 'Anchova',
    Trichiuridae: 'Peixe-espada', Sparidae: 'Esparídeos (sargos, marimbá, pargo)', Haemulidae: 'Hemulídeos (cocoroca, roncador, sargo-de-beiço)',
    Mugilidae: 'Tainhas', Ariidae: 'Bagres marinhos', Paralichthyidae: 'Linguados', Lutjanidae: 'Vermelhos (ariocó, cioba, guaiúba)',
    Epinephelidae: 'Garoupas, badejos e mero', Balistidae: 'Peixe-porco', Tetraodontidae: 'Baiacus', Diodontidae: 'Baiacus-de-espinho',
    Clupeidae: 'Sardinhas', Coryphaenidae: 'Dourado-do-mar', Scombridae: 'Cavalas, sororoca, bonito, atuns', Megalopidae: 'Camurupim',
    Elopidae: 'Ubarana', Rachycentridae: 'Bijupirá', Lobotidae: 'Prejereba', Gerreidae: 'Carapebas', Ephippidae: 'Enxada (paru)',
    Pomacentridae: 'Sargentinho', Characidae: 'Lambaris', Bryconidae: 'Dourado-de-rio e piraputangas', Cichlidae: 'Ciclídeos (tucunaré, tilápia, acará)',
    Erythrinidae: 'Traíra', Serrasalmidae: 'Pacu, tambaqui', Cyprinidae: 'Carpas', Heptapteridae: 'Jundiá', Prochilodontidae: 'Curimbatá'
  };
  // nome científico → dados
  const T = {
    // ---------- Carangídeos: o grupo mais confundido ----------
    'Caranx latus': { fam: 'Carangidae', rj: 'Xaréu-olhudo', br: ['Xaréu-branco', 'Xarelete', 'Graçaim', 'Olhudo'], en: 'Horse-eye jack', water: 'salgada',
      keys: 'OLHO MUITO GRANDE (diâmetro maior que o focinho, daí "olhudo"); escudos da linha lateral posterior escuros; SEM mancha preta na base da nadadeira peitoral; peito inteiramente coberto de escamas; ponta da 2ª dorsal escura; caudal amarelada; perfil da cabeça menos rombudo que o xaréu.' },
    'Caranx hippos': { fam: 'Carangidae', rj: 'Xaréu', br: ['Xaréu-vaqueiro', 'Cabeçudo', 'Xaréu-preto'], en: 'Crevalle jack', water: 'salgada',
      keys: 'MANCHA PRETA NA BASE/AXILA DA PEITORAL e mancha preta na borda do opérculo; cabeça alta e rombuda (perfil quase vertical); olho proporcionalmente menor que o do olhudo; peito SEM escamas exceto um pequeno grupo à frente das pélvicas; corpo alto, dorso esverdeado.' },
    'Caranx crysos': { fam: 'Carangidae', rj: 'Xerelete', br: ['Carapau'], en: 'Blue runner', water: 'salgada',
      keys: 'Corpo mais baixo e alongado que os xaréus; cor oliva/esverdeada a cinza-azulada; pequena mancha escura no alto do opérculo; sem mancha na peitoral; escudos numerosos e destacados; olho médio; comum em tamanho pequeno (até ~40 cm).' },
    'Caranx ruber': { fam: 'Carangidae', rj: 'Guarajuba', br: ['Xarelete', 'Carapau'], en: 'Bar jack', water: 'salgada',
      keys: 'FAIXA ESCURA ao longo da base da dorsal que continua pelo LOBO INFERIOR da caudal; faixa azul-clara logo abaixo; corpo prateado comprimido.' },
    'Seriola dumerili': { fam: 'Carangidae', rj: 'Olho-de-boi', br: ['Arabaiana', 'Serviola'], en: 'Greater amberjack', water: 'salgada',
      keys: 'FAIXA ESCURA DIAGONAL atravessando o olho até a nuca; faixa amarelada longitudinal no flanco; SEM escudos na linha lateral; corpo alongado e robusto; grande porte.' },
    'Seriola lalandi': { fam: 'Carangidae', rj: 'Olhete', br: ['Olho-de-boi'], en: 'Yellowtail amberjack', water: 'salgada',
      keys: 'Como o olho-de-boi, mas faixa no olho fraca ou ausente, caudal amarelada viva, corpo mais fusiforme; sem escudos.' },
    'Selar crumenophthalmus': { fam: 'Carangidae', rj: 'Xixarro', br: ['Chicharro', 'Garapau'], en: 'Bigeye scad', water: 'salgada',
      keys: 'Peixe pequeno e alongado com OLHO ENORME; sulco no ombro sob o opérculo; escudos só na parte final da linha lateral; dorso azulado. Não confundir com o xaréu-olhudo (que tem corpo alto).' },
    'Trachurus lathami': { fam: 'Carangidae', rj: 'Xixarro', br: ['Chicharro'], en: 'Rough scad', water: 'salgada',
      keys: 'Pequeno, alongado; ESCUDOS AO LONGO DE TODA a linha lateral, que faz curva acentuada; mancha escura no opérculo.' },
    'Chloroscombrus chrysurus': { fam: 'Carangidae', rj: 'Palombeta', br: ['Folha', 'Pelombeta'], en: 'Atlantic bumper', water: 'salgada',
      keys: 'Pequeno, muito comprimido, ventre mais curvo que o dorso; MANCHA PRETA EM SELA no alto do pedúnculo caudal; ventre amarelado.' },
    'Oligoplites saurus': { fam: 'Carangidae', rj: 'Guaivira', br: ['Tibiro', 'Solteira'], en: 'Leatherjacket', water: 'salgada',
      keys: 'Corpo alongado e achatado lateralmente, escamas embutidas (pele de couro); espinhos da 1ª dorsal SEPARADOS; dorso azulado e flanco/nadadeiras amarelados.' },
    'Trachinotus carolinus': { fam: 'Carangidae', rj: 'Pampo', br: ['Pampo-amarelo', 'Pampo-verdadeiro'], en: 'Florida pompano', water: 'salgada',
      keys: 'Corpo alto e oval, focinho ROMBUDO; sem escudos; prateado com amarelo no ventre e nadadeiras; dorsal e anal curtas (não longas como no galhudo).' },
    'Trachinotus goodei': { fam: 'Carangidae', rj: 'Pampo-galhudo', br: ['Galhudo', 'Pampo-listrado'], en: 'Palometa', water: 'salgada',
      keys: 'Dorsal e anal MUITO LONGAS e escuras, em foice; 4 faixas verticais estreitas escuras no flanco; prateado.' },
    'Trachinotus falcatus': { fam: 'Carangidae', rj: 'Sernambiguara', br: ['Pampo-arabebéu'], en: 'Permit', water: 'salgada',
      keys: 'Corpo MUITO alto e grande porte; sem faixas no adulto; mancha escura na base da peitoral em alguns; dorsal/anal falcadas mas mais curtas que no galhudo.' },
    'Selene vomer': { fam: 'Carangidae', rj: 'Peixe-galo', br: ['Galo', 'Galo-de-fita'], en: 'Lookdown', water: 'salgada',
      keys: 'Corpo extremamente alto e comprimido, PERFIL DA CABEÇA QUASE VERTICAL; lobos anteriores da 2ª dorsal e anal MUITO LONGOS (filamentos).' },
    'Selene setapinnis': { fam: 'Carangidae', rj: 'Peixe-galo', br: ['Galo-testudo'], en: 'Atlantic moonfish', water: 'salgada',
      keys: 'Corpo alto e comprimido, prateado; perfil da cabeça inclinado (não vertical); SEM filamentos longos no adulto; pequena mancha escura no pedúnculo.' },
    'Alectis ciliaris': { fam: 'Carangidae', rj: 'Galo-de-penacho', br: ['Abacatuaia'], en: 'African pompano', water: 'salgada',
      keys: 'Corpo alto e prateado; jovens com filamentos extremamente longos nas nadadeiras; adultos com perfil da cabeça arredondado e escudos fracos.' },
    // ---------- Robalos ----------
    'Centropomus undecimalis': { fam: 'Centropomidae', rj: 'Robalo-flecha', br: ['Camurim', 'Robalão'], en: 'Common snook', water: 'salgada',
      keys: 'Corpo ALONGADO e baixo; focinho longo com mandíbula inferior projetada; LINHA LATERAL PRETA bem marcada até a cauda; nadadeira pélvica clara; maior porte.' },
    'Centropomus parallelus': { fam: 'Centropomidae', rj: 'Robalo-peva', br: ['Peva', 'Camurim-peba'], en: 'Fat snook', water: 'salgada',
      keys: 'Como o flecha, mas CORPO MAIS ALTO e curto, escamas menores, pélvica amarelada; porte menor.' },
    'Centropomus ensiferus': { fam: 'Centropomidae', rj: 'Robalo-espinha', br: ['Robalo-de-espinho'], en: 'Swordspine snook', water: 'salgada',
      keys: 'Pequeno; 2º ESPINHO DA ANAL MUITO LONGO, alcançando a base da caudal.' },
    // ---------- Cienídeos ----------
    'Micropogonias furnieri': { fam: 'Sciaenidae', rj: 'Corvina', br: ['Cururuca'], en: 'Whitemouth croaker', water: 'salgada',
      keys: 'Vários BARBILHÕES PEQUENOS sob o queixo; LISTRAS OBLÍQUAS escuras no dorso acompanhando as escamas; boca inferior; corpo prateado-dourado.' },
    'Cynoscion acoupa': { fam: 'Sciaenidae', rj: 'Pescada-amarela', br: ['Pescada-cambucu', 'Cambucu'], en: 'Acoupa weakfish', water: 'salgada',
      keys: 'SEM barbilhões; boca grande e oblíqua com 1–2 caninos fortes na mandíbula superior; corpo alongado, tons amarelados/dourados; grande porte.' },
    'Cynoscion leiarchus': { fam: 'Sciaenidae', rj: 'Pescada-branca', br: ['Pescada-boca-mole'], en: 'Smooth weakfish', water: 'salgada',
      keys: 'Sem barbilhões; prateada, interior da boca alaranjado; caninos presentes; porte médio.' },
    'Cynoscion jamaicensis': { fam: 'Sciaenidae', rj: 'Goete', br: ['Pescada-goete'], en: 'Jamaica weakfish', water: 'salgada',
      keys: 'Pequena pescada sem barbilhões, corpo mais alto e curto, prateada com pontos escuros em fileiras oblíquas.' },
    'Menticirrhus americanus': { fam: 'Sciaenidae', rj: 'Papa-terra', br: ['Betara', 'Judeu'], en: 'Southern kingfish', water: 'salgada',
      keys: 'UM ÚNICO barbilhão curto e grosso no queixo; focinho saliente sobre a boca inferior; FAIXAS OBLÍQUAS ESCURAS em V nos flancos; sem bexiga natatória (nada no fundo da arrebentação).' },
    'Menticirrhus littoralis': { fam: 'Sciaenidae', rj: 'Papa-terra', br: ['Betara-preta', 'Boca-de-rato'], en: 'Gulf kingfish', water: 'salgada',
      keys: 'Igual ao anterior (barbilhão único), mas SEM faixas: prateado uniforme, ponta da caudal escura.' },
    'Pogonias cromis': { fam: 'Sciaenidae', rj: 'Miraguaia', br: ['Burriquete'], en: 'Black drum', water: 'salgada',
      keys: 'MUITOS barbilhões sob o queixo; corpo alto e arqueado; jovens com 4–5 faixas verticais largas escuras; adultos acinzentados e grandes.' },
    // ---------- outros marinhos ----------
    'Pomatomus saltatrix': { fam: 'Pomatomidae', rj: 'Anchova', br: ['Enchova'], en: 'Bluefish', water: 'salgada',
      keys: 'Corpo fusiforme verde-azulado; DENTES AFIADOS e triangulares; MANCHA PRETA na base da peitoral; 1ª dorsal baixa com espinhos curtos.' },
    'Trichiurus lepturus': { fam: 'Trichiuridae', rj: 'Espada', br: ['Peixe-espada', 'Catana'], en: 'Largehead hairtail', water: 'salgada',
      keys: 'Corpo em FITA prateada, sem escamas; SEM nadadeira caudal (termina em ponta); dentes grandes em gancho.' },
    'Archosargus probatocephalus': { fam: 'Sparidae', rj: 'Sargo-de-dente', br: ['Sargo'], en: 'Sheepshead', water: 'salgada',
      keys: '5–6 FAIXAS VERTICAIS PRETAS largas sobre fundo cinza-claro; DENTES INCISIVOS tipo humanos; espinhos dorsais fortes.' },
    'Diplodus argenteus': { fam: 'Sparidae', rj: 'Marimbá', br: ['Sargo-prata'], en: 'Silver porgy', water: 'salgada',
      keys: 'Prateado com MANCHA PRETA no pedúnculo caudal; faixas verticais fracas; corpo oval comprimido.' },
    'Pagrus pagrus': { fam: 'Sparidae', rj: 'Pargo', br: ['Pargo-rosa'], en: 'Red porgy', water: 'salgada',
      keys: 'ROSADO a avermelhado com PEQUENOS PONTOS AZUIS; perfil da cabeça inclinado; caudal com pontas claras.' },
    'Anisotremus surinamensis': { fam: 'Haemulidae', rj: 'Sargo-de-beiço', br: ['Pirambu', 'Salema'], en: 'Black margate', water: 'salgada',
      keys: 'Corpo alto, LÁBIOS GROSSOS; parte dianteira do corpo mais escura (mancha escura sobre o flanco anterior); escamas com centro escuro.' },
    'Orthopristis ruber': { fam: 'Haemulidae', rj: 'Cocoroca', br: ['Corcoroca', 'Roncador'], en: 'Corocoro grunt', water: 'salgada',
      keys: 'Prateado com PONTOS BRONZE/AMARELADOS em linhas oblíquas; boca pequena; emite som de ronco.' },
    'Conodon nobilis': { fam: 'Haemulidae', rj: 'Roncador', br: ['Coró-listrado'], en: 'Barred grunt', water: 'salgada',
      keys: 'Corpo amarelado com ~8 FAIXAS VERTICAIS ESCURAS; espinho forte no pré-opérculo.' },
    'Mugil liza': { fam: 'Mugilidae', rj: 'Tainha', br: ['Tainha-verdadeira'], en: 'Lebranche mullet', water: 'salgada',
      keys: 'Cabeça achatada no alto, boca pequena sem dentes visíveis; LISTRAS LONGITUDINAIS ESCURAS nos flancos; duas dorsais bem separadas.' },
    'Mugil curema': { fam: 'Mugilidae', rj: 'Parati', br: ['Tainha-sajuba'], en: 'White mullet', water: 'salgada',
      keys: 'Como a tainha, mas SEM listras escuras; mancha dourada no opérculo; porte menor.' },
    'Genidens genidens': { fam: 'Ariidae', rj: 'Bagre', br: ['Bagre-urutu', 'Bagre-guri'], en: 'Guri sea catfish', water: 'salgada',
      keys: 'Sem escamas, 3 pares de barbilhões; espinhos serrilhados na dorsal e peitorais (ferroada dolorosa); porte pequeno a médio.' },
    'Genidens barbus': { fam: 'Ariidae', rj: 'Bagre-branco', br: ['Bagre-guri'], en: 'White sea catfish', water: 'salgada', protected: true,
      keys: 'Bagre grande, focinho mais longo e cabeça com placa óssea bem visível.' },
    'Bagre marinus': { fam: 'Ariidae', rj: 'Bagre-bandeira', br: ['Bagre-fita'], en: 'Gafftopsail catfish', water: 'salgada',
      keys: 'ESPINHOS DA DORSAL E PEITORAIS COM FILAMENTO LONGO em forma de fita; barbilhões achatados.' },
    'Paralichthys orbignyanus': { fam: 'Paralichthyidae', rj: 'Linguado', br: ['Linguado-branco'], en: 'Flounder', water: 'salgada',
      keys: 'Corpo achatado, os DOIS OLHOS do lado ESQUERDO (lado colorido para cima); boca grande com dentes; manchas ocelares no lado escuro.' },
    'Lutjanus synagris': { fam: 'Lutjanidae', rj: 'Ariocó', br: ['Vermelho-ariocó'], en: 'Lane snapper', water: 'salgada',
      keys: 'LISTRAS AMARELAS longitudinais sobre fundo rosado; MANCHA PRETA grande abaixo da dorsal posterior, sobre a linha lateral.' },
    'Lutjanus analis': { fam: 'Lutjanidae', rj: 'Cioba', br: ['Vermelho-cioba'], en: 'Mutton snapper', water: 'salgada',
      keys: 'Mancha preta PEQUENA acima da linha lateral; linhas azuis sob o olho; anal pontuda; tons oliva-avermelhados.' },
    'Ocyurus chrysurus': { fam: 'Lutjanidae', rj: 'Guaiúba', br: ['Cioba-mulata', 'Rabo-aberto'], en: 'Yellowtail snapper', water: 'salgada',
      keys: 'FAIXA AMARELA do focinho à cauda; cauda MUITO bifurcada e amarela.' },
    'Epinephelus marginatus': { fam: 'Epinephelidae', rj: 'Garoupa', br: ['Garoupa-verdadeira'], en: 'Dusky grouper', water: 'salgada', protected: true,
      keys: 'Marrom-avermelhada com MANCHAS CLARAS irregulares; borda das nadadeiras clara; mandíbula inferior saliente; caudal arredondada.' },
    'Epinephelus itajara': { fam: 'Epinephelidae', rj: 'Mero', br: ['Canapu'], en: 'Atlantic goliath grouper', water: 'salgada', protected: true,
      keys: 'ENORME; cabeça larga e achatada, olhos pequenos; pequenas manchas pretas; nadadeiras arredondadas. Pesca proibida no Brasil.' },
    'Mycteroperca acutirostris': { fam: 'Epinephelidae', rj: 'Badejo-mira', br: ['Badejo', 'Sirigado'], en: 'Comb grouper', water: 'salgada',
      keys: 'Focinho mais pontudo que as garoupas; padrão marmorizado escuro; caudal côncava (não arredondada).' },
    'Balistes capriscus': { fam: 'Balistidae', rj: 'Peixe-porco', br: ['Cangulo', 'Porquinho'], en: 'Grey triggerfish', water: 'salgada',
      keys: 'Pele grossa áspera; 1º espinho dorsal grosso que TRAVA; boca pequena com dentes fortes; cinza-oliva.' },
    'Sphoeroides testudineus': { fam: 'Tetraodontidae', rj: 'Baiacu', br: ['Baiacu-pintado'], en: 'Checkered puffer', water: 'salgada',
      keys: 'Infla; dorso com PADRÃO RETICULADO claro em fundo escuro; sem escamas; dentes em bico. TÓXICO.' },
    'Lagocephalus laevigatus': { fam: 'Tetraodontidae', rj: 'Baiacu-arara', br: ['Baiacu-garajuba'], en: 'Smooth puffer', water: 'salgada',
      keys: 'Baiacu grande e liso, dorso esverdeado e ventre branco, caudal côncava. TÓXICO.' },
    'Chilomycterus spinosus': { fam: 'Diodontidae', rj: 'Baiacu-de-espinho', br: ['Baiacu-espinho'], en: 'Brown burrfish', water: 'salgada',
      keys: 'Corpo coberto de ESPINHOS FIXOS curtos; manchas escuras; infla.' },
    'Sardinella brasiliensis': { fam: 'Clupeidae', rj: 'Sardinha', br: ['Sardinha-verdadeira'], en: 'Brazilian sardine', water: 'salgada',
      keys: 'Pequena, prateada com dorso azul-esverdeado; quilha de escudos no ventre; uma dorsal no meio do corpo.' },
    'Coryphaena hippurus': { fam: 'Coryphaenidae', rj: 'Dourado', br: ['Dourado-do-mar'], en: 'Mahi-mahi', water: 'salgada',
      keys: 'DORSAL CONTÍNUA da nuca até a cauda; verde-azulado com dourado e pontos azuis; macho com testa alta e vertical.' },
    'Scomberomorus brasiliensis': { fam: 'Scombridae', rj: 'Sororoca', br: ['Serra'], en: 'Serra Spanish mackerel', water: 'salgada',
      keys: 'Alongado, MANCHAS OVAIS DOURADAS/AMARELAS em fileiras nos flancos; linha lateral descendo suavemente; pínulas atrás da dorsal e anal.' },
    'Scomberomorus cavalla': { fam: 'Scombridae', rj: 'Cavala', br: ['Cavala-verdadeira'], en: 'King mackerel', water: 'salgada',
      keys: 'Adulto SEM manchas; LINHA LATERAL COM QUEDA ABRUPTA abaixo da 2ª dorsal; grande porte, cinza-ferro.' },
    'Euthynnus alletteratus': { fam: 'Scombridae', rj: 'Bonito', br: ['Bonito-pintado'], en: 'Little tunny', water: 'salgada',
      keys: 'LISTRAS ONDULADAS escuras só no dorso (atrás da dorsal) e ALGUMAS MANCHAS PRETAS entre a peitoral e a pélvica.' },
    'Thunnus albacares': { fam: 'Scombridae', rj: 'Albacora-laje', br: ['Atum-amarelo'], en: 'Yellowfin tuna', water: 'salgada',
      keys: '2ª dorsal e anal LONGAS e AMARELAS; faixa dourada no flanco; pínulas amarelas.' },
    'Megalops atlanticus': { fam: 'Megalopidae', rj: 'Camurupim', br: ['Pirapema', 'Tarpão'], en: 'Tarpon', water: 'salgada',
      keys: 'ESCAMAS ENORMES prateadas; boca virada para cima; último raio da dorsal em FILAMENTO longo.' },
    'Elops saurus': { fam: 'Elopidae', rj: 'Ubarana', br: [], en: 'Ladyfish', water: 'salgada',
      keys: 'Muito alongado e roliço, escamas pequenas prateadas; caudal profundamente bifurcada; sem filamento na dorsal.' },
    'Rachycentron canadum': { fam: 'Rachycentridae', rj: 'Bijupirá', br: ['Beijupirá', 'Cação-de-escama'], en: 'Cobia', water: 'salgada',
      keys: 'Cabeça larga e ACHATADA; faixa escura longitudinal; 1ª dorsal formada por espinhos curtos SEPARADOS; parece um tubarão pequeno.' },
    'Lobotes surinamensis': { fam: 'Lobotidae', rj: 'Prejereba', br: ['Dorminhoco'], en: 'Tripletail', water: 'salgada',
      keys: 'Dorsal e anal posteriores ARREDONDADAS e grandes, parecendo "três caudas"; marrom-mosqueado.' },
    'Eugerres brasilianus': { fam: 'Gerreidae', rj: 'Carapeba', br: ['Carapeba-listrada'], en: 'Brazilian mojarra', water: 'salgada',
      keys: 'Corpo alto prateado com LISTRAS ESCURAS longitudinais finas; boca muito protrátil.' },
    'Diapterus rhombeus': { fam: 'Gerreidae', rj: 'Carapicu', br: ['Carapeba-prata'], en: 'Caitipa mojarra', water: 'salgada',
      keys: 'Prateado sem listras, corpo em losango, 2º espinho da anal forte; pélvica amarelada.' },
    'Chaetodipterus faber': { fam: 'Ephippidae', rj: 'Enxada', br: ['Paru', 'Paru-branco'], en: 'Atlantic spadefish', water: 'salgada',
      keys: 'Corpo quase circular, muito comprimido; FAIXAS VERTICAIS ESCURAS; dorsal e anal com lobos altos.' },
    'Abudefduf saxatilis': { fam: 'Pomacentridae', rj: 'Sargentinho', br: ['Saberé'], en: 'Sergeant major', water: 'salgada',
      keys: 'Pequeno; 5 FAIXAS VERTICAIS PRETAS sobre fundo branco-amarelado.' },
    // ---------- água doce ----------
    'Salminus brasiliensis': { fam: 'Bryconidae', rj: 'Dourado', br: ['Dourado-de-rio', 'Pirajuba'], en: 'Golden dorado', water: 'doce',
      keys: 'Dourado intenso com FILEIRAS DE PONTOS PRETOS formando linhas finas; boca grande com dentes; faixa escura na caudal.' },
    'Cichla ocellaris': { fam: 'Cichlidae', rj: 'Tucunaré', br: ['Tucunaré-amarelo'], en: 'Butterfly peacock bass', water: 'doce',
      keys: 'OCELO (mancha preta com aro claro) na base da caudal; 3 manchas/faixas escuras verticais; boca grande.' },
    'Cichla kelberi': { fam: 'Cichlidae', rj: 'Tucunaré-amarelo', br: ['Tucunaré'], en: 'Yellow peacock bass', water: 'doce',
      keys: 'Amarelo com 3 faixas verticais escuras, ocelo na cauda, pontos claros nas nadadeiras.' },
    'Cichla piquiti': { fam: 'Cichlidae', rj: 'Tucunaré-azul', br: ['Tucunaré'], en: 'Blue peacock bass', water: 'doce',
      keys: '5 faixas verticais escuras estreitas; tons azulados; ocelo na cauda.' },
    'Oreochromis niloticus': { fam: 'Cichlidae', rj: 'Tilápia', br: ['Tilápia-do-nilo'], en: 'Nile tilapia', water: 'doce',
      keys: 'FAIXAS VERTICAIS ESCURAS REGULARES NA NADADEIRA CAUDAL; corpo cinza-esverdeado com faixas fracas.' },
    'Coptodon rendalli': { fam: 'Cichlidae', rj: 'Tilápia', br: ['Tilápia-rendalli'], en: 'Redbreast tilapia', water: 'doce',
      keys: 'Ventre/peito AVERMELHADO; mancha escura com aro claro na dorsal ("mancha de tilápia"); caudal sem faixas regulares.' },
    'Geophagus brasiliensis': { fam: 'Cichlidae', rj: 'Acará', br: ['Cará'], en: 'Pearl cichlid', water: 'doce',
      keys: 'PONTOS AZUL-BRILHANTES no corpo e cabeça; mancha escura no meio do flanco; corpo alto.' },
    'Hoplias malabaricus': { fam: 'Erythrinidae', rj: 'Traíra', br: ['Lobó', 'Taraíra'], en: 'Trahira', water: 'doce',
      keys: 'Corpo cilíndrico marrom-mosqueado; BOCA GRANDE com dentes caninos; caudal arredondada; sem nadadeira adiposa.' },
    'Piaractus mesopotamicus': { fam: 'Serrasalmidae', rj: 'Pacu', br: ['Pacu-caranha'], en: 'Small-scaled pacu', water: 'doce',
      keys: 'Corpo alto e discoide cinza-escuro; dentes molariformes; ventre amarelado/alaranjado.' },
    'Colossoma macropomum': { fam: 'Serrasalmidae', rj: 'Tambaqui', br: [], en: 'Tambaqui', water: 'doce',
      keys: 'Corpo alto; metade inferior e nadadeiras ESCURAS/PRETAS; dorso oliva.' },
    'Cyprinus carpio': { fam: 'Cyprinidae', rj: 'Carpa', br: ['Carpa-comum'], en: 'Common carp', water: 'doce',
      keys: '2 PARES DE BARBILHÕES na boca; escamas grandes douradas; dorsal longa.' },
    'Astyanax bimaculatus': { fam: 'Characidae', rj: 'Lambari', br: ['Lambari-do-rabo-amarelo', 'Piaba'], en: 'Twospot astyanax', water: 'doce',
      keys: 'Pequeno prateado; MANCHA UMERAL escura atrás da cabeça e mancha no pedúnculo; nadadeiras amarelas; adiposa presente.' },
    'Rhamdia quelen': { fam: 'Heptapteridae', rj: 'Jundiá', br: ['Bagre-sapo'], en: 'South American catfish', water: 'doce',
      keys: 'Bagre de água doce sem escamas, BARBILHÕES MAXILARES MUITO LONGOS; adiposa longa.' },
    'Prochilodus lineatus': { fam: 'Prochilodontidae', rj: 'Curimbatá', br: ['Curimba', 'Grumatã'], en: 'Streaked prochilod', water: 'doce',
      keys: 'BOCA EM VENTOSA com lábios carnudos; prateado com listras escuras longitudinais finas.' }
  };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const byNorm = new Map(Object.keys(T).map((k) => [norm(k), k]));
  function lookup(sci) {
    const n = norm(sci); if (!n) return null;
    const two = n.split(' ').slice(0, 2).join(' ');
    const k = byNorm.get(n) || byNorm.get(two);
    return k ? { sci: k, ...T[k] } : null;
  }
  // busca por nome popular (qualquer região) ou científico
  function search(q) {
    const n = norm(q); if (!n) return [];
    return Object.entries(T).filter(([k, v]) => norm(k).includes(n) || norm(v.rj).includes(n) || v.br.some((x) => norm(x).includes(n)) || norm(v.en).includes(n)).map(([k, v]) => ({ sci: k, ...v }));
  }
  function family(fam) { const f = Object.keys(F).find((x) => norm(x) === norm(fam)); return f ? Object.entries(T).filter(([, v]) => v.fam === f).map(([k, v]) => ({ sci: k, ...v })) : []; }

  const UF = [['AC', 'Acre', -9.97, -67.81], ['AL', 'Alagoas', -9.67, -35.74], ['AP', 'Amapá', .03, -51.07], ['AM', 'Amazonas', -3.12, -60.02], ['BA', 'Bahia', -12.97, -38.5], ['CE', 'Ceará', -3.73, -38.52], ['DF', 'Distrito Federal', -15.79, -47.88], ['ES', 'Espírito Santo', -20.32, -40.34], ['GO', 'Goiás', -16.68, -49.25], ['MA', 'Maranhão', -2.53, -44.3], ['MT', 'Mato Grosso', -15.6, -56.1], ['MS', 'Mato Grosso do Sul', -20.44, -54.65], ['MG', 'Minas Gerais', -19.92, -43.94], ['PA', 'Pará', -1.46, -48.49], ['PB', 'Paraíba', -7.12, -34.86], ['PR', 'Paraná', -25.43, -49.27], ['PE', 'Pernambuco', -8.05, -34.88], ['PI', 'Piauí', -5.09, -42.8], ['RJ', 'Rio de Janeiro', -22.9, -43.2], ['RN', 'Rio Grande do Norte', -5.79, -35.21], ['RS', 'Rio Grande do Sul', -30.03, -51.23], ['RO', 'Rondônia', -8.76, -63.9], ['RR', 'Roraima', 2.82, -60.67], ['SC', 'Santa Catarina', -27.6, -48.55], ['SP', 'São Paulo', -23.55, -46.63], ['SE', 'Sergipe', -10.91, -37.07], ['TO', 'Tocantins', -10.18, -48.33]];
  const inBrazil = (lat, lon) => lat < 5.4 && lat > -34 && lon > -74 && lon < -34.7;
  function regionFor(lat, lon) {
    if (lat == null || !inBrazil(lat, lon)) return { country: null, uf: null, label: lat == null ? 'Local desconhecido' : `coordenada ${lat.toFixed(3)}, ${lon.toFixed(3)}`, lat, lon };
    let best = UF[0], bd = 1e9; for (const u of UF) { const d = (u[2] - lat) ** 2 + (u[3] - lon) ** 2; if (d < bd) { bd = d; best = u; } }
    return { country: 'Brasil', uf: best[0], state: best[1], label: `${best[1]}, Brasil`, lat, lon };
  }
  // a tabela reflete os nomes do RJ (vale também para o Sudeste); fora dele o nome vem da IA
  function localName(entry, region) {
    if (!entry || !region || region.country !== 'Brasil') return null;
    return ['RJ', 'ES', 'SP', 'MG'].includes(region.uf) ? entry.rj : null;
  }
  root.FishNames = { T, F, lookup, search, family, regionFor, localName, UF, norm };
})(window);

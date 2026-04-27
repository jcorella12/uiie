-- ============================================================
-- Importación Q1 2026 — Excel PRIMER TRIMESTRE UIIE-CRE-021
-- 352 inspecciones | 8 inspectores | 322 clientes
-- Generated: 2026-04-21T17:39:53.724Z
-- NOTA: Ejecutar DESPUÉS de crear auth.users via Admin API
--       (ver supabase/scripts/create-inspector-auth-users.sh)
-- ============================================================

-- Deshabilitar FK para permitir inserción antes de crear auth.users
-- (los auth.users se crean vía Admin API con los mismos UUIDs)
SET session_replication_role = replica;

-- ── 1. Re-seed folios (formato real UIIE-XXX-2026) ─────────────
TRUNCATE public.folios_lista_control RESTART IDENTITY CASCADE;

INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
SELECT
  'UIIE-' || LPAD(n::TEXT, 3, '0') || '-2026',
  n,
  n IN (1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,52,53,54,55,56,57,58,59,60,61,62,63,64,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,83,84,85,86,88,89,90,91,92,94,95,96,97,98,101,102,103,104,105,106,108,109,110,111,114,115,116,117,118,119,120,121,122,123,124,125,126,128,129,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,227,228,229,230,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,251,252,253,254,258,259,260,261,262,263,264,265,266,267,269,270,271,272,273,278,279,280,281,283,284,285,286,287,288,289,290,301,302,303,305,306,307,308,309,310,311,312,313,314,315,316,317,318,320,323,324,325,326,327,328,329,330,331,332,333,334,335,336,338,341,342,345,347,348,349,350,351,354,355,356,358,359,360,361,362,363,367,368,370,374,376,377,378,380,381,382,383,384,385,386,388,390,391,392,393,394,395,396,398,399,400,401,402,409)
FROM generate_series(1, 509) AS n;

-- Folios 2025 históricos
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1150-2025', 11150, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1318-2025', 11318, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1319-2025', 11319, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1358-2025', 11358, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1367-2025', 11367, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1382-2025', 11382, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1393-2025', 11393, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1406-2025', 11406, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1412-2025', 11412, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1414-2025', 11414, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1416-2025', 11416, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1425-2025', 11425, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1426-2025', 11426, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1427-2025', 11427, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1428-2025', 11428, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1447-2025', 11447, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1448-2025', 11448, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1449-2025', 11449, true) ON CONFLICT (numero_folio) DO NOTHING;
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado) VALUES ('UIIE-1450-2025', 11450, true) ON CONFLICT (numero_folio) DO NOTHING;

-- ── 2. Inspectores en public.usuarios ──────────────────────────
INSERT INTO public.usuarios (id, email, nombre, rol, activo) VALUES
  ('543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'efraim.castellanos@ciae.mx', 'EFRAIM CASTELLANOS FRAYRE', 'inspector', true),
  ('c3cd3e66-c075-4fdf-be74-c981dac882cb', 'luis.martinez@ciae.mx', 'LUIS FELIPE MARTINEZ CERDA', 'inspector', true),
  ('5c207af9-2054-457f-893e-5e16427aae52', 'jesus.rodriguez@ciae.mx', 'JESUS ANTONIO RODRIGUEZ DE ITA', 'inspector', true),
  ('cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'hugo.diaz@ciae.mx', 'HUGO DIAZ GARCIA', 'inspector', true),
  ('4265bb74-9a89-4254-8bbd-b13660e0ed98', 'eduardo.montelongo@ciae.mx', 'EDUARDO MONTELONGO MORAL', 'inspector', true),
  ('dae0d247-7908-4d9c-a834-92c5883cdac3', 'erick.aguirre@ciae.mx', 'ERICK ANDRES AGUIRRE PRIETO', 'inspector', true),
  ('31442556-3938-4c4b-8bd5-b79893b556a0', 'aldo.ramirez@ciae.mx', 'ALDO RAMIREZ MONTOYA', 'inspector', true),
  ('a2a6fd3f-4a98-4501-b153-806f5c102c39', 'joaquin.corella@ciae.mx', 'JOAQUIN CORELLA PUENTE', 'inspector_responsable', true)
ON CONFLICT (email) DO UPDATE SET
  id     = EXCLUDED.id,
  nombre = EXCLUDED.nombre,
  rol    = EXCLUDED.rol,
  activo = true;

-- ── 3. Clientes históricos (322) ──────────────────
INSERT INTO public.clientes (id, tipo_persona, nombre, email, telefono, ciudad, estado, es_epc) VALUES
  ('c54046e0-e4b9-4b36-8823-f425ea217263', 'moral', 'WALDOS DOLAR MART DE MEXICO S DE RL DE CV', 'Lreyes@luxun.mx', '8661335252', 'ZACATECAS', 'ZACATECAS', false),
  ('b7525f3f-a444-4af6-a870-4d37c2fc052b', 'fisica', 'JESUS ANGEL MONTEMAYOR JARAMILLO', 'rsantiago@mmsolar.mx', '81225296114', 'ZUAZUA', 'NUEVO LEON', false),
  ('24db1776-8aa3-42e1-8820-aa9176c43db9', 'fisica', 'SALVADOR SANCHEZ GOMEZ', 'carnespremium_facture@outook.com', '9625294511', 'Tapachula', 'Chiapas', false),
  ('85b60521-797e-45db-85fa-e21ec0fedc9f', 'fisica', 'CARLOS ANTONIO LUTTMAN FOX', 'anaenelda@hotmail.com', '5548802162', 'Tapachula', 'Chiapas', false),
  ('456dc9ec-5a44-4468-bb0e-703e1470bc41', 'moral', '7-ELEVEN MEXICO SA DE CV', 'herman.parra@greenlux.com.mx', '8126205870', 'GUADALAJARA', 'JALISCO', false),
  ('07b9c52c-0656-4e11-b45f-dcca1b6d94e6', 'moral', 'CHIAPAS SIGLO XXI SA DE CV', 'admin@diariodechiapas.com', '9616931790', 'Tapachula', 'Chiapas', false),
  ('3248763a-a0af-4ba0-8649-8580ffa164d8', 'fisica', 'GUILLERMO OMAR GIM BURRUEL', 'delallatanoe@gmail.com', '6311303099', 'NOGALES', 'SONORA', false),
  ('3e564608-d21f-4c1e-8d71-53dec13e26fa', 'fisica', 'MARIA GUADALUPE ELIZONDO GUTIERREZ', 'supervision.mtysolar@gmail.com', '8183090988', 'SAN PEDRO', 'NUEVO LEON', false),
  ('d64cefe3-fc44-4ea4-8433-1fe8c00eb70d', 'fisica', 'MARTHA ELENA LOPEZ JIMENEZ', 'jorgerono84@gmail.com', '8444271410', 'SALTILLO', 'COAHUILA', false),
  ('9efff6bd-7387-4f70-bfd6-e85b6c9b27c6', 'moral', 'PALETAS MARA SA DE CV', 'uvie@hotmail.com', '3312814594', 'JALPA', 'ZACATECAS', false),
  ('38b4fc08-aac8-4b0a-bff2-7ebacb86c7d2', 'moral', 'ARNESES ELECTRICOS AUTOMOTRICES S.A. DE C.V.', 'm.ramirez@fourier.mx', '4424552943', 'SILAO', 'GUANAJUATO', false),
  ('72c0e440-3b72-4d76-adc1-45216eb385d3', 'fisica', 'ALIMENTOS BALANCEADOS AGPI S.P.R. DE R.L. DE C.V', 'contabilidad@grupoagpi.com', '8424220250', 'TORREÓN', 'COAHUILA', false),
  ('627216f4-b406-4704-9b1e-ca4d0964438e', 'moral', 'GRUPO TRACOM S.A. DE C.V.', 'adelarosa@tracom.com.mx', '8712349821', 'TORREÓN', 'COAHUILA', false),
  ('18e87ede-8292-4339-a97b-2f33dc6bf764', 'fisica', 'RAUL ARMANDO JARAMILLO LEAL', 'UMA_VICTORIA@HOTMAIL.COM', '8343011525', 'VICTORIA', 'TAMAULIPAS', false),
  ('ef904a1c-34c6-4a0e-a8b5-0a5cb828be09', 'fisica', 'HECTOR SALVADOR GONZALEZ LOZANO', 'dravizemtz@gmail.com', '8341750578', 'SOTO LA MARINA', 'TAMAULIPAS', false),
  ('f1c35498-b123-4a5e-bf7c-a3176ed5c1db', 'moral', 'COLEGIO DE CONTADORES PUBLICOS DE LA LAGUNA A.C.', 'administracion@ccpl.org.mx', '8717320228', 'TORREÓN', 'COAHUILA', false),
  ('c78fadcf-872f-4778-b9a9-8766e07d8696', 'fisica', 'BLANCA ESTHELA PEREZ TOSTADO', 'electriceye446@gmail.com', '8713571514', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('d33670ce-6e96-4017-9aac-cddee15134cd', 'fisica', 'JULISA MORAYMA ESPARZA RIOS', 'administracion@ensomex.mx', '6141608666', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('7e8a89fb-ff16-45af-b5ce-aa0eaaace30a', 'fisica', 'ENRIQUE VAZQUEZ TAMEZ', 'raul.vargas@silum.com.mx', '81355255', 'MONTERREY', 'NUEVO LEON', false),
  ('13c75784-939d-4a37-8c62-71d8abc48cac', 'moral', 'INDUSTRIALIZADORA SANZUBIA S.A. DE C.V', 'jairsantillanes@sanzubia.com', '6391200023', 'DELICIAS', 'CHIHUAHUA', false),
  ('437ca3f2-f7fd-49a2-9edd-a4a440068b48', 'fisica', 'KOSSIO NAVARRO SERGIO ARMANDO', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('c4f4ae51-004d-42d9-a943-790d63e8aeee', 'moral', 'GRANJA SIERRA OBSCURA S.A. DE C.V.', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'NAVOJOA', 'SONORA', false),
  ('418c5ef3-cd8a-43f2-b033-ea12db04faf5', 'moral', 'Alianza Para La Producción Soles S.A. de C.V.', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'CAJEME', 'SONORA', false),
  ('6c9e1776-35c6-44cc-b491-9006e433a6b6', 'moral', 'GONVAUTO PUEBLA S.A. DE C.V.', 'victor.gutierrez@powen.com', '5573360414', 'CUAUTLANCINGO', 'PUEBLA', false),
  ('d310a26f-cb97-4a3a-8735-4779636d012d', 'moral', 'NUEVA WAL MART DE MEXICO S. DE R. L. DE C. V.', 'carlos.rodriguez3@walmart.com', '5532234209', 'NOGALES', 'SONORA', false),
  ('964a4bc9-142f-4762-a6bf-812fa28660c4', 'fisica', 'ENRIQUE HERNANDEZ PACHECO', 'electriceye446@gmail.com', '8713571514', 'FRANCISCO I MADERO', 'COAHUILA', false),
  ('7bac8ed2-0a1c-4099-bb65-736398f1dc2c', 'moral', 'SAL SERVICIOS GASTRONOMICOS SA DE CV', 'proyectos.dpilaguna@gmail.com', '8711723022', 'TORREÓN', 'COAHUILA', false),
  ('4b124335-3ce1-409c-9f70-f4e9dc77bbee', 'fisica', 'LEGIONARIOS DE CRISTO', 'iguerrero@galt.com', '8132385959', 'MONTERREY', 'NUEVO LEON', false),
  ('f0f54a5c-3b47-44b6-9daf-384c204cefae', 'moral', 'DINAMICA EMPRESARIAL VETERINARIA SA DE CV', 'devsags@gmail.com', '4491116025', 'AGUASCALIENTES', 'AGUASCALIENTES', false),
  ('63de90c5-fae9-4256-a19b-e87d44628348', 'fisica', 'LUIBO', 'haraujo@grupopremier.com.mx', '6255798608', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('561392b0-fa2c-4d09-8e8d-4fff27bcf057', 'fisica', 'GUILLERMO AVALOS GONZALEZ', 'carlos.marcos@electroservicioslaguna.com', '8712111453', 'TORREÓN', 'COAHUILA', false),
  ('30e89e68-d105-4556-b332-96e9f44cf93d', 'fisica', 'MAURICIO CAMPA CRUZ', 'mauricio_c_c@hotmail.com', '8712599324', 'TORREÓN', 'COAHUILA', false),
  ('c8245d0f-daf9-4de9-8260-6ff57eed87de', 'fisica', 'HUMBERTO CARLOS TOHME CANALES', 'adrian@megaenergias.com.mx', '8711037628', 'TORREÓN', 'COAHUILA', false),
  ('a8a565ec-d10a-4bce-8330-fd8ba3dd4a5e', 'moral', 'OPERADORA DE CINEMAS S.A. DE C.V.', 'victor.gutierrez@powen.com', '5573360414', 'TIZAYUCA', 'HIDALGO', false),
  ('5ea2247c-e34e-4ad0-b185-d24355ca71a2', 'fisica', 'GUADALUPE JIMENEZ HERNANDEZ', 'ernesto.lagunez07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('5d5eec00-e5b7-4b9b-b4f2-cc100cf0985f', 'fisica', 'RIGOBERTO SALCIDO PONCE', 'doulossolar@gmail.com', '6271333512', 'VALLE DE ZARAGOZA', 'CHIHUAHUA', false),
  ('ffdec036-999d-4108-a001-f105430be2fc', 'moral', 'UREBLOCK SA DE CV', 'LCASAR@PROYENER.MX', '3311299080', 'PONCITLAN', 'JALISCO', false),
  ('3744c4dd-e833-4e46-bfc9-05e9e23a838b', 'fisica', 'CHAD PETER DOETZEL', 'uvie@hotmail.com', '3312814594', 'BAHIA DE BANDERAS', 'NAYARIT', false),
  ('92c85bac-7081-4443-b2a7-98d3da191b19', 'fisica', 'UNIVERSIDAD AUTONOMA DE AGUASCALIENTES', 'alberto.palacios@edu.uaa.mx', '4494107400', 'JESUS MARIA', 'AGUASCALIENTES', false),
  ('b3ea215b-d97a-46cf-9dc8-9c63e0cefa74', 'fisica', 'ROSAURA AGUILAR DE LA FUENTE', 'nicofacturas01@gmail.com', '8312321424', 'MANTE', 'TAMAULIPAS', false),
  ('9c2bd4bc-b730-4582-b628-99c18c77575e', 'fisica', 'JESUS MELQUIADES BERDON MARTINEZ', 'jesusberdon@qhotmail.com', '8341161625', 'HIDALGO', 'TAMAULIPAS', false),
  ('99b769c8-5126-4cb7-9f0b-5581efb95c4a', 'moral', 'LIEBHERR MTY S DE RL DE CV', 'javier@vivaelsol.mx', '811819622', 'GARCIA', 'NUEVO LEON', false),
  ('149d1042-4d1d-47bc-aca6-7e4c40bea242', 'fisica', 'JOSE PABLO GARZA PEREZ', 'javier@vivaelsol.mx', '811819622', 'SAN PEDRO', 'NUEVO LEON', false),
  ('7fc0f2b8-a804-4c2c-aafe-bc0389d87edf', 'fisica', 'JTA MPAL AGUA Y SMTO GUACHOCHI', 'pcastro@sigmacc.mx', '6141786020', 'GUACHOCHI', 'CHIHUAHUA', false),
  ('a4ce6448-8382-4cd9-b264-2ef37faa34b4', 'moral', 'AQUAHIELO DEL BAJIO SA DE CV', 'bleza@infinitysistempower.com', '3320781524', 'LEON, GUANAJUATO', 'GUANAJUATO', false),
  ('c62f3952-fbdc-4c58-9b25-211eefc54fc2', 'moral', 'MARMIFERA STONE S.A. DE C.V.', 'victor.gutierrez@powen.com', '5573360414', 'SAN BUENAVENTURA', 'PUEBLA', false),
  ('43437841-f2e9-487c-8c5f-88a9bf0264c3', 'fisica', 'TRANSPORTES INDUSTRIALES VITA', 'hlucero@sigmacc.mx', '6141786339', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('7dd84a32-eda1-47da-a4f9-6f0e84f44ea3', 'moral', 'COMBUST CARRET CARCO SA DE CV', 'ernesto.deltoro@construcarr.com', '3316093022', 'ZAPOTILTIC', 'JALISCO', false),
  ('65b5e226-6e8b-400d-8974-04862e7a9914', 'fisica', 'LUZ DEL CARMEN NORIEGA MUÑOZ', 'grupocaram@hotmail.com', '6624005555', 'HERMOSILLO', 'SONORA', false),
  ('b6cbeca9-abf8-4dab-b8d8-ecc3ea08712d', 'moral', 'MAQUINARIA MAGNUM S DE RL DE CV', 'yramirez@magnummachining.com', '8127622886', 'TORREÓN', 'COAHUILA', false),
  ('35b90303-5148-4807-b234-8f539951df2c', 'moral', 'COB CARRETEROS CARCO SA DE CV', 'ernesto.deltoro@construcarr.com', '3316093022', 'ZAPOTLAN EL GRANDE', 'JALISCO', false),
  ('60a53d72-3d64-4ebf-b001-fcfed7923084', 'fisica', 'ORGANIZACIÓN REAL FOODS', 'productos_delreal@yahoo.com.mx', '6392939302', 'SAUCILLO', 'CHIHUAHUA', false),
  ('83e89e97-6930-4656-84b9-7c632a163695', 'moral', 'LOMA GEMA S.A. DE C.V.', 'raymundo@pueblosolar.mx', '66211463733', 'HERMOSILLO', 'SONORA', false),
  ('1fb1bec1-f99b-41bc-891b-da98e67d84ef', 'moral', 'NIDO PARRAS SA DE CV', 'conta.cantineros@gmail.com', '8711588782', 'TORREON', 'COAHUILA', false),
  ('8a1d9d5e-4fd5-466c-a4b3-abb6dad50d60', 'moral', 'INMOBILIARIA BATARSE OFICIAL SA DE CV', 'proyectos.dpilaguna@gmail.com', '8711723022', 'TORREÓN', 'COAHUILA', false),
  ('dfcf8b1c-c32d-4cf4-92f1-49908cf34bdb', 'moral', 'CONSTRUCTORA CAPUCCINO SA DE CV', 'capuccino70@hotmail.com', '6622127257', 'HERMOSILLO', 'SONORA', false),
  ('ca69a536-f6c4-4e49-9c9b-a1019d219ee3', 'moral', 'KUEHNE NAGEL SA DE CV', 'victor.gutierrez@powen.com', '5573360414', 'CUAUTITLAN IZCALLI', 'ESTADO DE MEXICO', false),
  ('f9f90762-483e-46e7-8754-71dbc6fba2a5', 'moral', 'ROBEREST S DE RL DE CV', 'josepozosmelano@gmail.com', '3787068919', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('9f6c00e4-1db5-4a0c-8263-58758055baa4', 'moral', 'GRUPO EMPRESARIAL CAYPE SA DE CV', 'jorge.cordova@grupoblanquita.com', '8999211010', 'REYNOSA', 'TAMAULIPAS', false),
  ('e7ff319a-06d4-4b60-a1e6-e12235af4575', 'moral', 'EL ANCLADERO SA DE CV', 'josepozosmelano@gmail.com', '3797068919', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('f3b67e6e-b9b0-4547-bdf2-8ffeb23fafa0', 'fisica', 'JOSE GUADALUPE LOZANO GARCIA', 'super_lozano.02@gmail.com', '6768806072', 'PEÑON BLANCO', 'DURANGO', false),
  ('d9ce20ce-16af-488b-b7d3-b588e24edcb3', 'moral', 'SERV CONTR DE PER SECOPE SC', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('cbff6f1c-4a7f-431f-98ee-dc9f0d4f8e40', 'moral', 'SERVICIOS ADMINISTRATIVOS TRANSFORMANDO LA EDUCACION DE MEXICO S.C.', 'cvelasco@kairos.mx', '5585798905', 'HUEHUETOCA', 'MEXICO', false),
  ('e98e27a1-5f7b-49d3-8415-c911e9c33525', 'fisica', 'NANCY CANTU BENAVIDES', 'nabecantu71@gmail.com', '8112445564', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', false),
  ('4da549f1-6982-48ef-89c6-f86a664165eb', 'moral', 'BUD BLOOM SA DE CV', 'veronica.avalos@grupopaar.com.mx', '3338145523', 'SAN FRANCISCO DE LOS ROMO', 'AGUASCALIENTES', false),
  ('a624973e-1af2-468b-a116-84d16c04fcdc', 'fisica', 'PRODUCTORES Y AVICULTORES DE LA BOQUILLA DE TRANCAS EJIDO LA LOMA DGO SPR DE RL', 'miguel_dgz19@hotmail.com', '8713470409', 'LERDO', 'DURANGO', false),
  ('7bec732a-dcf8-4f03-9ff4-ff998ea2ee7a', 'fisica', 'ROBERTO ABRAHAM TAFICH SANTOS', 'administracion.mty@genergy.com.mx', '8180161478', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', false),
  ('4be31702-b9cc-4848-8f17-b070494e2ab0', 'fisica', 'ANTONIO PRISCILIANO GONZALEZ DUEÑES', 'idorado@dil.com.mx', '8714847235', 'TORREON', 'COAHUILA', false),
  ('2d360e66-b60b-4eb6-8548-fafe57b24772', 'fisica', 'CLARA LORENA VALDEZ GONZALEZ', 'carlos.marcos@electroservicioslaguna.com', '8712111453', 'SAN PEDRO', 'COAHUILA', false),
  ('4b5b6b8b-516d-48fe-8b7c-1f124a130f62', 'moral', 'SOCIEDAD INMOBILIARIA MEDICA', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('5d81fceb-56d0-4ff9-8db4-f148cc38218d', 'fisica', 'ENRIQUE GARCIA VILLARREAL', 'zuleth@solarlink.mx', '4811123477', 'SANTIAGO', 'NUEVO LEON', false),
  ('86bfb274-6c2d-4dcf-bf9a-2799be351300', 'moral', 'SOC INMOB MEDICA DE MEX SA CV', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('b999e744-1675-496b-8bba-298de9ef74cb', 'fisica', 'BENJAMIN GARCIA VILLARREAL', 'zuleth@solarlink.mx', '4811123477', 'SANTIAGO', 'NUEVO LEON', false),
  ('8f633351-b8d2-4a34-822a-94890d965ac0', 'fisica', 'EUGENIO ALEJANDRO GONZALEZ PEÑA', 'administracion.mty@genergy.com.mx', '8180161478', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', false),
  ('082d1362-f408-4a23-a1e7-e3ba1730e3cc', 'moral', 'MOTEL LA CIMA SA DE CV', 'miguel.gonzalez@isnsoluciones.com', '6562152587', 'JUAREZ', 'CHIHUAHUA', false),
  ('baae6669-fc81-4c88-a7db-41c2258df661', 'fisica', 'JOSE LUIS REYES ORTIZ', '1028cocacolo@gmail.com', '6183330855', 'DURANGO', 'DURANGO', false),
  ('5abf776e-5965-4b9c-baee-11d5f6c42fbc', 'fisica', 'DANIEL FRANCO CASILLAS', 'pseinterconexion3014@hotmail.com', '3471041055', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('557b0004-9648-40c7-b483-ca55e7e02621', 'moral', 'COPPEL S.A. DE C.V.', 'mjacobo@coppel.com', '6677594200', 'MERIDA', 'YUCATAN', false),
  ('89849b6a-6ae1-449d-8ffc-b531f7bb3dbb', 'fisica', 'ALBERTO MARQUEZ MARTINEZ', 'distribuidoralmark@gmail.com', '7751458516', 'POZA RICA DE HIDALGO', 'VERACRUZ', false),
  ('6c53d8cf-8a36-4375-9022-0abd97986047', 'fisica', 'ABARROTERA SUPER CAMARGO', 'arodriguez@eco-energia.mx', '6142901285', 'CAMARGO', 'CHIHUAHUA', false),
  ('e0797a46-9cde-4fad-86a9-2fd59eddb375', 'moral', 'AUTOSERVICIO ROSALES SA DE CV', 'rmoreno@rentatutecho.com', '6622816419', 'HERMOSILLO', 'SONORA', false),
  ('2e8e1b9c-95d5-4156-b3a0-43998a486245', 'fisica', 'ERGIO ROMEO GONZALEZ DE LA PEÑA', 'naxgv@hotmail.com', '8113698059', 'ARTEAGA', 'NUEVO LEON', false),
  ('2de1f6eb-b0a6-44ec-bd63-f3b9ac3456d8', 'fisica', 'AMEZOLA GUZMAN CRISTIAN', 'josedelrefugioz28@gmail.com', '3320395360', 'ZAPOTLANEJO', 'JALISCO', false),
  ('f3b7940f-2dd1-4a42-b0e0-6ebd14987e4c', 'moral', 'GRUPO OPERADOR DE SERVICIOS INTEGRADOS SIG SA DE CV', 'alfredo.ruizmil@icloud.com', '8712807852', 'DURANGO', 'DURANGO', false),
  ('de200679-10fa-4dfb-9a41-0fbb6014b243', 'fisica', 'HELENA MARTENS NEUFELD', 'fernandoreyes.uvie@hotmail.com', '6255828379', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('a2abba01-9bc1-45c6-ac24-cab3aba56e22', 'fisica', 'ANDRES GARCIA VILLARREAL', 'zuleth@solarlink.mx', '4811123477', 'SANTIAGO', 'NUEVO LEON', false),
  ('f17bf2a1-d706-4f67-95aa-1bc0d9fa82a0', 'moral', 'G.M. SUPERMERCADO SA DE CV', 'jesusmeneses1993@gmail.com', '6621682070', 'AGUA PRIETA', 'SONORA', false),
  ('453a06a6-0eec-41b7-976e-c13b6f214192', 'moral', 'COLEGIO INGENIEROS CIVILES DE SONORA AC', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('66df89bc-0cd7-4d44-95e9-6b6eb00cf422', 'fisica', 'JOSE CARLOS SERRATO CASTELL', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('02775f72-c3ba-4a3f-9163-d8205df7581e', 'fisica', 'MARIA DEL CARMEN RUBIO PINO', 'jorge@rescom.mx', '6622689661', 'HERMOSILLO', 'SONORA', false),
  ('fb6a3c33-1f4e-4f92-9fc9-94d24cd1c740', 'fisica', 'FEDERICO RAMIREZ MELO', 'federico2772@hotmail.com', '8771143035', 'ACUÑA', 'COAHUILA', false),
  ('59cb7a0b-897c-4b05-842d-be03b40ad32b', 'fisica', 'SERGIO ARMANDO GONZALEZ CERDA', 'contabilidadnl@genergy.com.mx', '8671942997', 'NUEVO LAREDO', 'TAMAULIPAS', false),
  ('0fa21631-b4f3-41d1-b039-3b7e490fa7a9', 'fisica', 'ELOY ENRIQUEZ HERNANDEZ', 'centrocambiarioarael@hotmail.com', '8911012540', 'GUSTAVO DIAZ ORDAZ', 'TAMAULIPAS', false),
  ('1a7b7ffd-e007-4a7f-90c9-df31511a6e52', 'fisica', 'FLORESTHELA DAVILA PLATAS', 'jjhonson@greensolar.com.mx', '8991608558', 'REYNOSA', 'TAMAULIPAS', false),
  ('e28ee7e1-af2c-402c-b645-eccc13a3c7e9', 'moral', 'CARVIROSA INDUSTRIAL S.A. DE C.V.', 'dcv@carvirosa.com', '8261053198', 'ALLENDE', 'NUEVO LEON', false),
  ('c1f50423-8622-47ac-bc81-c4729eb7843c', 'fisica', 'SERGIO MUÑOZ GRIJALVA', 'ventasfilm@gmail.com', '6391069868', 'DELICIAS', 'CHIHUAHUA', false),
  ('0d36a2ad-d9ce-425f-a912-82a0843df926', 'fisica', 'UACH TECNO PARQUE 1', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('a6f9d352-ab95-49cb-b47a-8b763b125444', 'moral', 'FRUTAS PERLA SA DE CV', 'a.lara@helasolar.com', '3317509976', 'PARACUARO', 'MICHOACAN', false),
  ('1b1ea238-3bcd-4a57-9d06-f09e52159b9e', 'fisica', 'KBY INDUSTRIALS RL CV', 'tania.lucio@kby.com', '4441942594', 'VILLA DE REYES', 'SAN LUIS POTOSI', false),
  ('22443284-fa76-46d7-a77d-f58776e02a2b', 'moral', 'AZTECA CONFITERIA SA DE CV', 'victor.gutierrez@powen.com', '5573360414', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', false),
  ('b02593f7-fe4d-4334-ab8c-272accf8314a', 'fisica', 'ZIANYA DE LOS ANGELES SAENZ LEAL', 'hugogarzagomez@gmail.com', '8992870600', 'REYNOSA', 'TAMAULIPAS', false),
  ('4fcb9713-015f-4311-849b-0a67a6980771', 'moral', 'INMOBILIARIA PONTEVER S.A. DE C.V.', 'wakeinhome@gmail.com', '9841764007', 'SOLIDARIDAD', 'QUINTANA ROO', false),
  ('4133ea93-6f11-45d5-9698-67c0e0882102', 'moral', 'PETROMAX S.A. DE C.V.', 'ing.mipg@gmail.com', '3329070344', 'GUADALUPE', 'NUEVO LEON', false),
  ('776791ce-d331-42de-a58e-0f395fb8515c', 'fisica', 'TRANY DISENOS Y MODA CHIHUAHUENSE', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('8faf71f9-a586-461a-afec-be2d3b26e52b', 'moral', 'ESTRAL ENERGY S DE RL DE CV', 'miguel.cruz@amaranzero.com', '5662240288', 'EL SALTO', 'JALISCO', false),
  ('a9cbe106-eda8-490c-8ec2-3897df56f112', 'fisica', 'JUAN CARLOS PEÑA CAMPOS', 'uvie@hotmail.com', '3312814594', 'LOS RAMONES', 'NUEVO LEON', false),
  ('3a71de08-38e9-46a4-8457-1ea4a524eb9d', 'fisica', 'GONZALEZ AMAYA YADIRA PATRICIA', 'patricia_glz@yahoo.com.mx', '8341337887', 'VICTORIA', 'TAMAULIPAS', false),
  ('29ab0b35-b0e2-49aa-8774-8aaa149aa74f', 'fisica', 'NANCY EDITH RODRIGUEZ HERNANDEZ', 'uma_victoria@hotmail.com', '8343011525', 'VICTORIA', 'TAMAULIPAS', false),
  ('deeb2db5-f41c-4f29-beb5-381f88e038e8', 'fisica', 'MUNICIPIO DE SOLEDAD DE DOBLADO', 'ernesto.lagunes07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('551bb842-963f-4568-82fd-51368ecf0085', 'fisica', 'OCTAVIO MARIN DE LA ROSA', 'octaviomarindelarosa1@gmail.com', '9626225393', 'Tapachula', 'Chiapas', false),
  ('adc8afef-1e0b-4446-bf11-5963122631ed', 'fisica', 'Hugo Flores Sánchez', 'hugofrutas2022@gmail.com', '9621356535', 'Tapachula', 'Chiapas', false),
  ('cda5eca5-e6c9-4ac8-af40-4985e28986d6', 'fisica', 'MUNICIPIO DE SOLEDAD DE DOBLADO (PASO LAGARTO)', 'ernesto.lagunes07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('b7710ad4-f65b-4cff-a85e-9668100ecfc9', 'fisica', 'MUNICIPIO DE SOLEDAD DE DOBLADO (PASO SOLANO)', 'ernesto.lagunes07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('ab617a62-794f-460d-8eca-ac48bdfc1004', 'fisica', 'OSCAR ANDRES ALDUENDA AMAYA', 'bertha@energiaslimpias.mx', '8118001173', 'VALLE DE SANTO DOMINGO', 'BAJA CALIFORNIA SUR', false),
  ('d5c8120f-021a-4e10-b82f-326dc2f36766', 'fisica', 'HERNANDEZ GUTIERREZ IVAN ALONSO', 'francisco.ssanchezs@gmail.com', '3315020481', 'SAN MIGUEL EL ALTO', 'JALISCO', false),
  ('c092acab-5587-4ae3-9594-ebd3dfcba16e', 'fisica', 'LUIS GERARDO TOVAR ALANIS', 'mdavila@grupoati.com', '8448804973', 'MONTERREY', 'NUEVO LEÓN', false),
  ('9ac42cdb-038c-4c21-9889-e7be190a540a', 'fisica', 'BENAVIDES DELGADO ALEJANDRO', 'uvie@hotmail.com', '3312814594', 'LOS AYALA', 'NAYARIT', false),
  ('0e316534-b5d4-42ab-bd9c-8d3f8694b47f', 'fisica', 'JESUS SALDIVAR ARMENDARIZ', 'greenmarketenergy@gmail.com', '6141972162', 'MEOQUI', 'CHIHUAHUA', false),
  ('9352cbf9-3b43-452e-b6e8-ce7c845e0309', 'moral', '7 ELEVEN MEXICO SA DE CV', 'admin@helasolar.com', '3324795740', 'GUADALAJARA', 'JALISCO', false),
  ('0cb20fd8-8634-4d5d-9f0d-868a6589cb88', 'fisica', 'CARLOS RIGOBERTO ESCOBEDO LUNA', 'uvie@hotmail.com', '3312814594', 'ZAPOPAN', 'JALISCO', false),
  ('d3a2ebb3-ef45-4c74-a8be-73d2f4175818', 'fisica', 'INSTITUTO TECNOLOGICO Y DE ESTUDIOS SUPERIORES DE MONTERREY', 'victor.gutierrez@powen.com', '5573360414', 'JESUS MARIA', 'AGUASCALIENTES', false),
  ('f80294f5-1cd3-456e-9790-1fa5b221891e', 'moral', 'INSTITUTO MIGUEL ANGEL DE OCCIDENTE AC', 'uvie@hotmail.com', '3312814594', 'ZAPOPAN', 'JALISCO', false),
  ('a7be4cac-a3bd-4119-b97f-a57177160220', 'moral', 'SUPER SERVICIO GUADALUPE INSURGENTES SA DE CV', 'administracion@estacionssgi.com', '7282811250', 'LERMA', 'ESTADO DE MÉXICO', false),
  ('dbc03ba1-abaa-4d32-8e84-a05d00f534f0', 'fisica', 'JUAN ANTONIO CURIEL CURIEL', 'zvi.compras@gmail.com', '9569980382', 'ABASOLO', 'TAMAULIPAS', false),
  ('b2a93fb3-b066-4484-8489-fce19ee790f0', 'fisica', 'MARIA IRENE MEDRANO GONZALEZ', 'ayolanda500@gmail.com', '6181220334', 'DURANGO', 'DURANGO', false),
  ('77600db6-f7ec-40ea-a950-d9c56068a3a6', 'moral', 'COMPAÑIA COMERCIAL CIMACO SA DE CV', 'moises.moreno@ejecutivostorreon.com.mx', '8712612185', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('52493195-e21e-409f-b98c-bce2ffd74182', 'moral', 'C FERNANDEZ Y CIA S.A. DE C.V.', 'francisco.fernandez@white.com.mx', '8334279388', 'TAMPICO', 'TAMAULIPAS', false),
  ('ff2efd61-516e-4e6c-9fd0-7038bea4a2e8', 'fisica', 'PEDRO MALDONADO RAMOS', 'uvie@hotmail.com', '3312814594', 'ZAPOTLAN DEL REY', 'JALISCO', false),
  ('f7fc119a-8f6c-4afb-9f25-6ba0ebb1c7b1', 'fisica', 'LUIS ANTONIO CONTRERAS PARTIDA', 'almazan15g@hotmail.com', '3931096851', 'CONCEPCION DE BUENOS AIRES', 'JALISCO', false),
  ('4e7d2fdb-5173-4497-bbb6-6e0ab6c3a967', 'fisica', 'GOMEZ MUÑOZ DANIEL', 'mauriciog9628@gmail.com', '3787901813', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('52850f62-362c-4dae-a403-618bc8e8aec0', 'fisica', 'JOSE LUIS DE LA REE ABRIL', 'juan@delaree.com', '8112446770', 'HERMOSILLO', 'SONORA', false),
  ('a0476799-3c58-49d2-83da-8d5ae6314bf4', 'fisica', 'GSF FITNESS SAPI DE CV', 'dcorral@trinova.com.mx', '6141926002', 'TIJUANA', 'BAJA CALIFORNIA', false),
  ('65d5597d-b250-4824-9ed5-251a75baf290', 'moral', 'LAS CONCHAS PESQUERAS CCO S DE RL DE CV', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('43a5bb6b-2456-4595-944e-1b690d044002', 'moral', 'SONORA NATURALS SA DE CV', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('128bc809-692e-4ec6-88b5-ab4ac7d8a04f', 'fisica', 'MAURICIO DEUTSCH AZCARRAGA', 'mauricio@grupokuale.com.mx', '8116282825', 'TAMPICO', 'TAMAULIPAS', false),
  ('a9072697-2223-428b-b524-ffbf7f992ae9', 'fisica', 'ASOC REG DE NINOS AUTISTAS', 'donativos@autismoarena.org.mx', '8114056514', 'SANTA CATARINA', 'NUEVO LEON', false),
  ('ec5a886c-6534-46a1-8055-a8b323c9dd5d', 'fisica', 'JOSE LUIS VILLASEÑOR HUERTA', 'uvie@hotmail.com', '3312814594', 'CASIMIRO CASTILLO', 'JALISCO', false),
  ('d472c02e-fe97-4911-b4c8-7871d31a3a47', 'fisica', 'MARIA EUGENIA CAMPOS GALVAN', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('7a5dd0f1-91dd-46f8-8653-ac74204d9a89', 'moral', 'IND GASTRONOMICA DE PARRAL SA', 'jesuscarrillotrev@gmail.com', '6146015477', 'DELICIAS', 'CHIHUAHUA', false),
  ('582cab0f-b845-4413-a875-53e10ba873a9', 'fisica', 'JOSE GUADALUPE NAVA REYNA', 'nava-adriana@hotmail.com', '8128909057', 'VICTORIA', 'TAMAULIPAS', false),
  ('11a26f50-098c-4c03-8270-2d92692f86d0', 'moral', 'ULTRA PURIFICADORA RUPAL SA DE CV', 'aguarudy@gmail.com', '8232340343', 'GENERAL BRAVO', 'NUEVO LEON', false),
  ('483e80a1-6bef-4b24-93a2-6def08de0a6e', 'moral', 'TELNEC SA DE CV', '371227377@qq.com', '5546041777', 'TLALNEPANTLA DE BAZ', 'ESTADO DE MEXICO', false),
  ('7f108d49-d6ec-414a-ac90-8fd7938dfbe9', 'moral', 'ARCOS SERCAL INMOBILIARIA S. DE R.L. DE C.V.', 'victor.gutierrez@powen.com', '5573360414', 'BENITO JUAREZ', 'QUINTANA ROO', false),
  ('73f9e8f0-bd8b-47e2-82ce-7d447c2f8496', 'fisica', 'GENMAR S. DE P.R. DE R.L. DE C.V.', 'plopez.genmar@gmail.com', '8717471044', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('39f791f0-3836-4ed1-a52a-0cb8b23634e4', 'moral', 'SERVICIO VALOR SA DE CV', 'ivett_rg@hotmail.com', '8341444820', 'CD VICTORIA', 'TAMAULIPAS', false),
  ('854a20f3-d3f9-48ca-85dc-39f521ab0c94', 'moral', 'GALAXY BOL SA DE CV', 'ivillarello@hotmail.com', '8441229571', 'SALTILLO', 'COAHUILA', false),
  ('d24a7889-e673-4f73-a466-1a06125508eb', 'fisica', 'GRANJA EL QUIJOTE S. DE P.R DE R.L.', 'almazan15g@hotamil.com', '3931096851', 'JAMAY', 'JALISCO', false),
  ('29d5a04e-5692-4732-9507-b8b1534a5164', 'fisica', 'JORGE RODRIGUEZ JIMENEZ', 'bleza@infinitysistempower.com', '3420781524', 'ZAPOTLANEJO', 'JALISCO', false),
  ('73c35afd-859d-4ed9-a6be-dad39252585b', 'moral', 'CONCESIONARIA AUTOPISTA GDL TEPIC SA DE CV', 'yair.benavidez@powen.com', '5625534531', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', false),
  ('c0a203a1-918c-475b-b10b-bd3d96bace6a', 'fisica', 'MARICELA GONZALEZ MACILLAS', 'alex.villarreal@tavisa.com', '8116654394', 'MONTERREY', 'NUEVO LEON', false),
  ('0f55d00e-4682-4a11-830e-2bf9fe66707c', 'moral', 'INDUSTRIAL VENDOR MEX SA DE CV', 'ventassermex@gmail.com', '8661729348', 'MONCLOVA', 'COAHUILA', false),
  ('38c6bd56-2555-42ab-bac4-f632c11def4e', 'moral', 'TRANSPORTADORA OLIGAS S.A. DE C.V.', 'edgar.alvarez@oligas.com', '3320743532', 'TALA', 'JALISCO', false),
  ('c5d26259-c1f2-4b4f-9ea4-71f6e31c5362', 'moral', 'COPIADORAS Y SERVICIOS DE SONORA SA DE CV', 'iecindustrial@gmail.com', '6413210056', 'HERMOSILLO', 'SONORA', false),
  ('3301e3d6-c2f0-41ba-a353-ea93a8fbc401', 'moral', 'COMERCIALIZADORA ABC LAGUNA SA DE CV', 'admon@intemx.com', '8713913382', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('5aa3cdf0-21d2-4334-9f68-e20690e02ba2', 'fisica', 'MA. MAYELA QUEZADA CARRILLO', 'mamayela.quezada@docentecoahuila.gob.mx', '8721047076', 'SAN PEDRO', 'COAHUILA', false),
  ('8737316b-c20c-4f40-8960-3ab3d0d0e472', 'moral', 'MEDICINA DE ALTA ESPECIALIDAD VICTORENSE S DE RL DE CV', 'silvia_abby2408@hotmail.com', '8341190935', 'VICTORIA', 'TAMAULIPAS', false),
  ('4d857786-8cb0-455f-b23d-b1f09f913f1a', 'fisica', 'ISELA ALEJANDRA ALFARO IZAGUIRRE', 'iselalfaro@live.com', '8110503480', 'VICTORIA', 'TAMAULIPAS', false),
  ('fe648eed-a22e-4ea9-b045-1a888cc8ee07', 'moral', 'CONCESIONARIA AUTOPISTA GUADALAJARA TEPIC SA DE CV', 'yair.benavidez@powen.com', '5625534531', 'ACATLAN DE JUAREZ', 'JALISCO', false),
  ('04273b70-5b03-4db9-a0d0-52af96864916', 'fisica', 'ALIMENTOS BALANCEADOS LA MEZCALERA S.P.R. DE R.L. DE C.V.', 'francisco.ssanchezs@gmail.com', '3415020481', 'SAN JUAN DE LOS LAGOS', 'JALISCO', false),
  ('c9b34afd-7845-4728-8d54-549af94d76ee', 'fisica', 'MALDONADO VELASCO IGNACIO', 'bleza@infinitysistempower.com', '3420781524', 'ZAPOTLANEJO', 'JALISCO', false),
  ('39d8ee9c-c2fc-4f14-95ed-0e8682b1ed5c', 'fisica', 'HUGO FLORES ORDOÑEZ', 'magaly_170293@hotmail.com', '6142883325', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('76dc7b3a-16e9-4157-bf83-ef43f145732e', 'moral', 'COPPEL SA DE CV', 'patricia.cardenas@coppel.com', '6672280975', 'LEON', 'GUANAJUATO', false),
  ('1d0b4382-d51e-45f7-95cb-f877fff4cdef', 'fisica', 'ARQUIDIOCESIS DE HERMOSILLO AR', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('bd3bf7e1-7cdb-4b48-bc91-f32b029f6378', 'fisica', 'HIRMA ALICIA ROSAS MARTINEZ', 'delallatanoe@gmail.com', '6311303099', 'NOGALES', 'SONORA', false),
  ('e191f7e9-ef9e-4a81-b550-29e72c51adba', 'fisica', 'LUIS EDUARDO COLLADO SOBERA', 'rosamariagonzalez@me.com', '8331881789', 'TAMPICO', 'TAMAULIPAS', false),
  ('dfaf253b-eb01-4e1c-ad7c-2148047ad8f9', 'fisica', 'MUNICIPIO DE NOGALES SONORA', 'delallatanoe@gmail.com', '6311303099', 'NOGALES', 'SONORA', false),
  ('f88b780e-1ccc-4f37-bbe6-37c18d316407', 'fisica', 'CARLOS RAFAEL BEJARANO CELAYA', 'delallatanoe@gmail.com', '6311303099', 'IMURIS', 'SONORA', false),
  ('1ad9fbf0-83f8-44bd-aec7-fd1003ed3702', 'moral', 'PROCESOS Y SUMINISTROS GV SA DE CV', 'iecindustrial@gmail.com', '6413210056', 'SANTA ANA', 'SONORA', false),
  ('472d5a7c-2db7-48b9-87ab-8de24fcbe59d', 'fisica', 'JAVIER FRANCISCO MORENO DAVILA', 'iecindustrial@gmail.com', '6413210056', 'SANTA ANA', 'SONORA', false),
  ('4a5a78db-eb16-4fd4-b991-d53652ed111b', 'moral', 'NUEVA WAL MART DE MEXICO S DE RL DE CV', 'cesar.suarez@walmart.com', '5623485396', 'Monclova', 'Coahuila', false),
  ('cd0f0766-9bd6-4f56-a914-9fed97b282f6', 'moral', 'DISTRIBUIDORA SUMERCA SA DE CV', 'pgonzalez@sumerca.mx', '8115315319', 'APODACA', 'NUEVO LEÓN', false),
  ('12d4c07b-3ffd-42f6-96cf-43592907ff24', 'moral', 'PAVIMENTOS TERSA SA DE CV', 'concretos@ruter.mx', '8343404675', 'VICTORIA', 'TAMAULIPAS', false),
  ('370023a9-4a1f-4a67-aef1-51d753c00acb', 'moral', 'HOSPITAL DEL COUNTRY SA DE CV', 'ingeneria@mtpsolar.mx', '3329544103', 'GUADALAJARA', 'JALISCO', false),
  ('f1ba5796-7433-4a9a-afcb-e1e3c2a9f9d8', 'moral', 'INMOBILIARIA ROLAMA SC', 'lorena.gracia@gmail.com', '6291014983', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('306009fa-6133-4da9-851a-928b7cee6d9a', 'fisica', 'ARIEL ENCINAS GRACIA', 'xharolito30@gmail.com', '6442740024', 'CAJEME,', 'SONORA', false),
  ('eda6b6df-d1d0-4cad-8130-322a1d384aab', 'fisica', 'LA IGLESIA DE JESUCRISTO DE LOS SANTOS DE LOS ULTIMOS DIAS EN MEXICO AR', 'javierlicona@churchofjesuschrist.org', '8711135266', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('5e446e32-2639-4c55-9aac-a850d0914124', 'moral', 'BANCO NACIONAL DE MEXICO, S.A.', 'mordonez@paredesarquitectos.com.mx', '5543039790', 'SAN MARCOS', 'ESTADO DE GUERRERO', false),
  ('0392574f-aa0b-41d2-8814-96f7b8a6ed06', 'moral', 'FRUTERIA SAN FRANCISCO DE HERMOSILLO SA DE CV', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'HERMOSILLO', 'SONORA', false),
  ('7874a63a-1c23-4eee-9904-7a6b7a711bc2', 'fisica', 'IRAYDA ELIBEE RODRIGUEZ CONTRERAS', 'i_guerrero1@hotmail.com', '8132385959', 'SAN PEDRO', 'NUEVO LEON', false),
  ('22ec6a36-6c95-481b-93f9-f98d0005ac8a', 'fisica', 'MARTIN GUADALUPE LOPEZ CHAVEZ', 'loslegendariosmty@gmail.com', '818683739', 'SANTIAGO', 'NUEVO LEON', false),
  ('ffb303d0-474d-4122-b892-2565aa5fb9dd', 'moral', 'PROMOTORA DE SEGURIDAD INDUSTRIAL SA DE CV', 'cesar.morales@bluesun.mx', '6566481129', 'JUAREZ', 'CHIHUAHUA', false),
  ('a6aa2e38-ef30-4de7-8d75-a9b833b3045b', 'fisica', 'MUNICIPIO DE SOLEDAD DE DOBLADO  (ESPINAL DE STA BARBARA)', 'ernesto.lagunes07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('772bc921-11dc-4bad-ad48-c8ab185d93fc', 'fisica', 'MUNICIPIO DE SOLEDAD DE DOBLADO (TEPETATES)', 'ernesto.lagunes07@gmail.com', '2851116183', 'SOLEDAD DE DOBLADO', 'VERACRUZ', false),
  ('90935a18-f8a6-44ce-9ff1-9210e2bc7d0a', 'fisica', 'CENTRO EDUCATIVO ORALIA GUERRA DE VILLARREAL', 'geny.uns@gmail.com', '8682981430', 'MATAMOROS', 'TAMAULIPAS', false),
  ('ef75187d-cb07-4985-978e-603b506ee015', 'fisica', 'JOSE JUAN FLORES VELA', 'juanjorow21@gmail.com', '8117984086', 'SANTIAGO', 'NUEVO LEON', false),
  ('508cab3d-9c6b-4ede-bc1e-58c842da9c8f', 'fisica', 'HOMERO DE LA GARZA TAMEZ', 'hannevegagovela@gmail.com', '8343010102', 'VICTORIA', 'TAMAULIPAS', false),
  ('22883cbf-007f-476a-adf1-9894e8dd6bb9', 'fisica', 'TRISTAN SALAZAR RICARDO', 'mauricio.ramirez@kbsolar.com.mx', '8112567211', 'SANTIAGO', 'NUEVO LEON', false),
  ('3a1085d8-5ac1-4d23-b012-c7e654ce4f95', 'fisica', 'OPERADORA DE FRANQUICIAS SAILE', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('197ddbd6-4f64-443e-94ab-142289036bd9', 'fisica', 'ORLANDO VALDEZ RODRIGUEZ', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('948ffb29-562b-4d1c-97f6-713e76cf29f3', 'moral', 'PROMOTORA DE HOGARES SA DE CV', 'raymundo@pueblosolar.mx', '66211463733', 'HERMOSILLO', 'SONORA', false),
  ('a7be20e2-df1e-4b7c-a17e-60f8b44d14d3', 'fisica', 'MARCO ANTONIO RUIZ HERNANDEZ', 'markoruizh@gmail.com', '6621540722', 'HERMOSILLO', 'SONORA', false),
  ('5312878a-02ba-45c5-9b09-83cabbda7527', 'fisica', 'NYDIA IRLANDA GARCIA MURILLO', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'HERMOSILLO', 'SONORA', false),
  ('b08c9f36-8ced-4a01-aa15-f910c690fa8a', 'fisica', 'SONIA GRISELDA LOZANO CISNEROS', 'gurrutia@solarprofitmx.mx', '8116369451', 'HIDALGO', 'NUEVO LEON', false),
  ('40da10c4-ebc5-4006-a4a2-e003e3cf71f8', 'fisica', 'JESUS MARIO LOZANO CISNEROS', 'gurrutia@solarprofitmx.mx', '8116369451', 'HIDALGO', 'NUEVO LEON', false),
  ('19d10776-f266-4431-8460-bab525d2bdd4', 'fisica', 'SUPER CARNES MENI SRL DE CV', 'supercarnes_menny@yahoo.com.mx', '6144198493', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('2a0cca1d-c432-49cd-9cf4-159c84b4a615', 'fisica', 'SERGIO CARLOS GARCIA RASCON', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'GUAYMAS', 'SONORA', false),
  ('97f8d710-cfd5-4537-9846-85d40ed357b8', 'moral', 'AGROTATO SA DE CV', 'bernardobay@agricolabay.com', '6622448800', 'HERMOSILLO', 'SONORA', false),
  ('75abea04-ff28-4842-b139-fa8a400e7a3c', 'fisica', 'BEPIN S.P.R. DE R.L. DE C.V.', 'yocanaco@hotmail.com', '8711890468', 'NAZAS', 'DURANGO', false),
  ('a128d67d-3d63-4fba-a8e3-0a06509e656b', 'fisica', 'ELIDA GUEL FLORES', 'moramx@gmail.com', '8713810678', 'TORREÓN', 'COAHUILA', false),
  ('a100b9ce-d6d5-4784-9400-aaf2a571f633', 'moral', 'SYCIJAL SA', 'csperez@tresel.com.mx', '3311775810', 'ZAPOPAN', 'JALISCO', false),
  ('85b18d59-20d4-4136-a917-8d4411ab78e8', 'fisica', 'TOMAS MATIAS ROMAN MIER', 'contabilidad@np6torreon.com', '8711376379', 'TORREÓN', 'COAHUILA', false),
  ('41ebdced-8afb-430d-8d0b-ddbaf648c546', 'moral', 'DISTRIBUIDORA SUMERCA SA DE CV (LOS HEROES)', 'pgonzalez@sumerca.mx', '8115315319', 'GARCIA', 'NUEVO LEÓN', false),
  ('e9e38d9a-def6-48d5-8da7-e0839340a0de', 'fisica', 'RODRIGUEZ MENDOZA MARGARITA', 'miguel.fuentes@fuvasolar.com', '8443004986', 'SALTILLO', 'COAHUILA', false),
  ('02fdeb23-70ed-412c-a375-2caf3fc187ed', 'fisica', 'GLIDER SALTILLO S. DE R.L. DE C.V.', 'daniel.gomez@powen.mx', '5546681289', 'SALTILLO', 'COAHUILA,', false),
  ('b7309dbc-cf99-4fca-bf99-079b43a5ef87', 'moral', 'AGROFE SA DE CV', 'contabilidadagrofe.mx', '6251607643', 'AHUMADA', 'CHIHUAHUA', false),
  ('23f8c038-6f9c-4df7-8b1e-ffe53095f5c8', 'fisica', 'SOLORIO AVALOS RAFAEL', 'soloriorafael52@gmail.com', '3311338686', 'TOTOTLAN', 'JALISCO', false),
  ('9b02645f-4502-4069-93ee-d4fdae6f9f11', 'fisica', 'MARIO ALBERTO VALDES BERLANGA', 'carlosvaldesq@establonl.com', '8712627370', 'FRANCISCO I MADERO', 'COAHUILA', false),
  ('5747b335-8763-4a43-b1a9-2388bd8a79c4', 'moral', 'BULL DENIM SA DE CV (715)', 'ernesto.gonzalez@grupodenim.com.mx', '8717575994', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('a251cc22-8bb3-465b-bc2e-fad1fb135f15', 'moral', 'VIO ROCA COMERCIAL S DE RL DE CV', 'josepozosmelano@gmail.com', '3787068919', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('64512541-a6ea-4cf7-aa6f-6b1349fa92a8', 'fisica', 'MUÑOZ REYNOSO CELINA', 'rogore1423@gmail.com', '3788852573', 'SAN JULIAN', 'JALISCO', false),
  ('721ac0d0-8a29-43ec-8e65-94430af7caf4', 'fisica', 'SARA FRANCISCA RŪIZ DIAZ', 'sara@civalle.com', '8332180097', 'TAMPICO', 'TAMAULIPAS', false),
  ('e561c34e-d5ce-46df-9cd3-847a12ef2787', 'fisica', 'ANA SOFIA TORRES ZOLEZZI', 'zuleth@solarlink.mx', '4811123477', 'SANTA CATARINA', 'NUEVO LEON', false),
  ('f6c25363-7382-422f-ba68-2b9d922d7aae', 'fisica', 'HERNANDEZ HERNANDEZ VIVIANA FA', 'miguel.fuentes@fuvasolar.com', '8443004986', 'SALTILLO', 'COAHUILA', false),
  ('3f9d2130-45c1-4760-a37b-a12199861656', 'fisica', 'MARIO FRANCISCO RUIZ ZAMORA', 'marioruizm1983@gmail.com', '93125877332', 'MADERO', 'TAMAULIPAS', false),
  ('4ba907a0-1204-42aa-8066-30eb05d503ae', 'fisica', 'JUAN RENE BASAÑEZ', 'renebasanezmijes@hotmail.com', '4424753710', 'CIUDAD MADERO', 'TAMAULIPAS', false),
  ('169c0f41-29b6-49e7-b48d-57127fab963e', 'moral', 'BULL DENIM SA DE CV (731)', 'ernesto.gonzalez@grupodenim.com.mx', '8717575994', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('3fdd3583-ec60-46e6-8bcd-7328eaa47564', 'fisica', 'JENNIFER MAYTE ANDRADE DELGADO', 'jjhonson@greensolar.com.mx', '8941022433', 'REYNOSA', 'TAMAULIPAS', false),
  ('8aea3d76-078b-4732-ac20-96913834bd3b', 'moral', 'TRANSERVICIOS LOGISTICOS DEL NORTE', 'alanis_m202@hotmail.com', '8261367893', 'PESQUERIA', 'NUEVO LEON', false),
  ('522144a4-ce47-4b35-8dda-3b01cca464e8', 'fisica', 'MUÑOZ RAMIREZ LUIS EDUARDO', 'ventas@arlosolar.com', '3481338866', 'UNION DE SAN ANTONIO', 'JALISCO', false),
  ('5bd98294-ce7d-466d-bb7d-c98b83d9d9ad', 'fisica', 'COMITE DE AGUA POTABLE CAMPO 33', 'jorgelozano0994@gmail.com', '6251307872', 'RIVA PALACIO', 'CHIHUAHUA', false),
  ('ad427267-1ae3-46bf-bee1-d962e8880372', 'fisica', 'GRANJA EL OLIVO SPR DE RL', 'ebesa@outlook.com', '8712303593', 'GOMEZ PALACIO', 'CHIHUAHUA', false),
  ('9292c9aa-17a0-4793-94f2-7c86a671529a', 'fisica', 'SALVADOR REYES HERNANDEZ', 'info@eadelosaltos.com', '3471096162', 'AGUASCALIENTES', 'AGUASCALIENTES', false),
  ('923165c1-ed92-420e-a91f-a98a6402ae63', 'moral', 'AUTO LINEAS AMERICA S.A DE C.V', 'miguel.cruz@amaranzero.com', '5662240288', 'NUEVO LAREDO', 'TAMAULIPAS', false),
  ('ef0d61d8-df55-443c-b7cb-dbe2d1bd69df', 'fisica', 'PATRICIA AGUILAR RINCON', 'alex_solis69@hotmail.com', '6521019066', 'MADERA', 'CHIHUAHUA', false),
  ('5046af5a-0fce-4ab0-a457-00f28b5cd61c', 'moral', 'COMERCIALIZADORA FIVICRUMA SA DE CV', 'raymundo@pueblosolar.mx', '66211463733', 'HERMOSILLO', 'SONORA', false),
  ('88b67b75-9b5f-4b2f-892e-50c946b4bc78', 'moral', '7 - ELEVEN DE MEXICO S.A. DE C.V.', 'admin@helasolar.com', '3324795740', 'GUADALAJARA', 'JALISCO', false),
  ('c94f10c1-615d-43c1-98eb-905d13ab3cb0', 'fisica', 'LUIS ADRIAN CHAVEZ', 'luis.chavez1979@outlook.com', '6561666637', 'JUAREZ', 'CHIHUAHUA', false),
  ('8b73ef30-df63-4641-9429-46c0050673bc', 'fisica', 'MERCADO CAMBERO RICHARD PAUL', 'raulmercara@hotmail.com', '3111195240', 'XALISCO', 'NAYARIT', false),
  ('bbaf2ffc-9310-4596-a7ee-24f414cf1c3d', 'moral', 'CONCESIONARIA BICENTENARIO SA DE CV', 'iibanez@cbicentenario.com.mx', '4778546139', 'CELAYA', 'GUANAJUATO', false),
  ('6286355f-07e7-4555-bfe7-9d96a4ea4d24', 'moral', 'CAU SA DE CV', 'relizondo@causa.com.mx', '8717500035', 'TORREON', 'COAHUILA DE ZARAGOZA', false),
  ('09a9d60e-f089-469a-99e5-7473603f3aca', 'fisica', 'SIGILFRIDO MILIAN FLORES', 'sigymilflores56@hotmail.com', '7671021663', 'PUNGARABATO', 'GUERRERO', false),
  ('56f58f63-276d-4b06-8fb1-095b4e412b92', 'fisica', 'SERGIO ANTONIO MARTINEZ LOPEZ', 'solar@climasprado.com', '8661123954', 'MONCLOVA', 'COAHUILA', false),
  ('3edf3dab-be9a-42ca-b13b-ade1fa4752b7', 'fisica', 'IRIS BELINDA FRAGA LOPEZ', 'energyp.proyectos@gmail.com', '8662134478', 'MONCLOVA', 'COAHUILA', false),
  ('72afbc7a-e692-4881-b993-42a5212e3a7a', 'fisica', 'ZEBRA PEN MANUFACTURERA SRL CV', 'jadiaz@prologis.com', '8343542013', 'APODACA', 'NUEVO LEON', false),
  ('9b000d14-a3c3-45e9-b780-7c6c2a5f99c7', 'fisica', 'JAIME VILLASEÑOR DE LOZA', 'octavio@solcenter.com.mx', '3787819499', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('474967e6-123c-44c3-9284-9838f77809bc', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (JMAS CASETA OSMOSIS)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('7dc4f886-9d16-4aff-b605-5a920c398a2a', 'moral', 'GAS NATURAL DEL NOROESTE SA DE CV', 'agamboa@gasnaturalindustrial.com.mx', '8711188161', 'TORREON', 'COAHUILA DE ZARAGOZA', false),
  ('71988014-46b5-43eb-8d39-0b26688bc8cd', 'moral', 'AUTOMOTORES REYNOSA S.A. DE C.V.', 'carlos.sosa@grupoinlosa.com', '8999090350', 'REYNOSA', 'TAMAULIPAS', false),
  ('3ece90e1-3ca6-477d-8a75-39e30abe2dd6', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (JMA PLANTA 2 PLAZUELA DE ACUNA)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('ec5d1d1e-1587-4e66-8428-27c31ec44be1', 'moral', 'ROGMAR SA DE CV', 'uvie@hotmail.com', '3312814594', 'GUADALAJARA', 'JALISCO', false),
  ('675620f4-646c-4bcc-80ec-9561fef78876', 'moral', 'AGROPECUARIA MARLET SA DE CV (OASIS 2)', 'ilich.ramirez@dpilaguna.com', '8711723022', 'SAN PEDRO', 'COAHUILA DE ZARAGOZA', false),
  ('5d77e990-3e5b-479f-8954-e5e368b67756', 'moral', 'AGROPECUARIA MARLET SA DE CV (OASIS 1)', 'ilich.ramirez@dpilaguna.com', '8711723022', 'SAN PEDRO', 'COAHUILA DE ZARAGOZA', false),
  ('46f28a6a-4f6b-44a8-820a-ca80e1db11a3', 'moral', 'ENSEÑANZA E INVESTIGACION SUPERIOR A.C.', 'victor.gutierrez@powen.com', '5573360414', 'BENITO JUAREZ', 'QUINTANA ROO', false),
  ('b40b6260-7e7d-44a8-9507-2fe65aa7a5fd', 'moral', 'RESTAURANTES RAPIDOS DE COAHUILA SA DE CV', 'bernardo.vergara@vpproyectos.com', '8661121577', 'MONCLOVA', 'COAHUILA', false),
  ('27496cf4-9233-41f9-8b41-91a3470ffb64', 'fisica', 'ELIZABETH AVELLANEDA CHAVEZ', 'eliza-avellaneda@hotmail.com', '7676720178', 'PUNGARABATO', 'GUERRERO', false),
  ('30c06caa-b407-4029-8872-97ae6a652f19', 'fisica', 'KLASSEN HOLDINGS', 'magaly_170293@hotmail.com', '6142883325', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('6826acba-465a-4367-9f71-d2eb13e6fb7e', 'fisica', 'SERVICE ZONE DE RL DE CV', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('03efcf93-ec71-4227-9904-927b9b1e054c', 'moral', 'MORINT CONSULTORA SA DE CV', 'invoice@remoteteamsolutions.com', '8711361963', 'TORREÓN', 'COAHUILA DE ZARAGOZA', false),
  ('ff589a22-62f7-44a6-a437-586168f0a72d', 'fisica', 'CARLOS URIEL NOYOLA CEDILLO', 'cnoyolac49@hotmail.com', '8717271933', 'TORREÓN', 'COAHUILA DE ZARAGOZA', false),
  ('938ab2dc-cf3c-4964-98e0-b09cd5a19346', 'fisica', 'SONIA LEIJA TORRES', 'javier@vivaelsol.mx', '8111819622', 'GUADALUPE', 'NUEVO LEON', false),
  ('f58b2e95-b40c-4986-a67f-6a6fbcb99ffc', 'fisica', 'PATRONATO PREPAPARATORIA ORALIA GUERRA DE VILLARREAL', 'geny.uns@gmail.com', '8682981430', 'MATAMOROS', 'TAMAULIPAS', false),
  ('2ea7af4b-7929-46aa-8495-cf77ae8f2d3d', 'moral', 'ARGOTAM S.A. DE C.V.', 'hugogarzagomez@gmail.com', '8992870600', 'REYNOSA', 'TAMAULIPAS', false),
  ('40f3f10d-259c-47c5-8a9f-10d2ff623dec', 'fisica', 'FONDO AYUDA SINDICAL MUTUALISTA SECC 28 DEL SNTE', 'jesusmeneses1993@gmail.com', '6621682070', 'CAJEME', 'SONORA', false),
  ('c5aa7cf3-ec86-4384-9e85-791292e576db', 'fisica', 'GLORIA ZORAYA SOTO HERNANDEZ', 'rrrmorelos@gmail.com', '6441140670', 'CAJEME', 'SONORA', false),
  ('68859226-e59e-4b96-a7e0-52f2ce00240b', 'moral', 'DISTRIBUIDORA SUMERCA SA DE CV (CANTORAL)', 'pgonzalez@sumerca.mx', '8115315319', 'PESQUERÍA', 'NUEVO LEÓN', false),
  ('a62fde09-53bb-4b23-a59e-a0d43684ebe3', 'fisica', 'CYNTHIA VICTORIA BRAVO ORTEGA', 'electriceye446@gmail.com', '8713571514', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('34431f7a-9545-41ca-9728-9022646fae5f', 'fisica', 'MARTHA PATRICIA MADRIGAL CORTEZ', 'contabilidadnl@genergy.com.mx', '8671942997', 'NUEVO LAREDO', 'TAMAULIPAS', false),
  ('ad9a2fec-737d-4647-b57a-dc9e4d31ebbb', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (JMAS CASETA OSMOSIS KM29 NTE)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('d39a2867-b7ba-410a-90e9-48360b2fb128', 'fisica', 'CESAR VILLARREAL GARZA', 'bernardo.vergara@vpproyectos.com', '8666517472', 'MONCLOVA', 'COAHUILA', false),
  ('702bafa4-cf37-4681-895e-ca165f68b0b3', 'moral', 'TRANSERVICIOS LOGISTICOS DEL NORTE SA DE CV', 'alanis_m202@hotmail.com', '8120728821', 'PESQUERIA', 'NUEVO LEON', false),
  ('fdd3bc2b-51e5-4589-9ae5-c694e64d58b0', 'moral', 'CONFIANZA AUTORAMA SA DE CV', 'gcontable@mg-irapuato.com', '4731638971', 'ZAMORA', 'MICHOACAN', false),
  ('cf6e9f11-a262-49fe-a880-1b80690312dc', 'moral', 'NUEVA WAL-MART DE MEXICO S DE RL DE CV', 'carlos.rodriguez3@walmart.com', '8991220103', 'ASCENSION', 'CHIHUAHUA', false),
  ('a0498f25-422f-4766-95c4-82c7ce543d48', 'fisica', 'MARIA GUADALUPE GARCIA GUERRERO', 'paulinagq3@gmail.com', '8712251892', 'TORREÓN', 'COAHUILA', false),
  ('1cce6b2e-fc06-4ba3-8e85-685f040dd9ac', 'fisica', 'ALEJANDRO RANDOLPH PROBERT CANSECO', 'administracion.mty@genergy.com.mx', '8115287418', 'SAN PEDRO GARZA GARCIA', 'NEUVO LEON', false),
  ('278a0f4e-a51a-46b1-88f6-66e51fae38a8', 'fisica', 'IRMA SAMANIEGO HERNANDEZ', 'proyectos@dscsistemas.com', '8112214935', 'MONTERREY', 'NUEVO LEON', false),
  ('785e9aec-ed53-40c5-a457-27de950bbe68', 'fisica', 'FCO JAVIER RODRIGUEZ GOMEZ', 'ferretodolabarca@prodigy.net.mx', '3931001403', 'IXTLAHUACAN DEL RIO', 'JALISCO', false),
  ('1ee00e14-1ced-40d0-aa4b-3c871ee42044', 'moral', 'GAXFER SA DE CV', 'JAZIELSOQUI@GMAIL.COM', '6621825803', 'GUAYMAS', 'SONORA', false),
  ('38e86faa-6909-429d-beb9-5b93a0259690', 'moral', 'EPL DE LA FRONTERA S.A. DE C.V.', 'hugogarzagomez@gmail.com', '8992870600', 'RIO BRAVO', 'TAMAULIPAS', false),
  ('ea058f10-f922-4f65-b73d-e81db19768a1', 'fisica', 'MA DE JESUS AGUIRRE SOLORIO', 'Andreauriast@gmail.com', '6141963380', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('7f26cb49-72ae-4410-ba1e-5f5188e9dd11', 'fisica', 'MARCELINO RAMIREZ AVILA', 'nueces-damm@hotmail.com', '6391186221', 'DELICIAS', 'CHIHUAHUA', false),
  ('ae91506f-7b82-4b63-a7a7-903f499b9417', 'moral', 'E P INSUMOS SA DE CV', 'administracion@epinsumos.com', '4421868843', 'QUERÉTARO', 'QUERÉTARO', false),
  ('45148300-f446-4303-a590-9276c6c3afa6', 'fisica', 'ERNESTO GUADALUPE RODRIGUEZ TAMEZ', 'hcabrera@besun.mx', '8111819822', 'CADEREYTA JIMENEZ', 'NUEVO LEON', false),
  ('689d8614-8e2e-4893-acf2-63003eae46f4', 'moral', 'ACCESO AUTOMOTRIZ SA DE CV', 'mmartinez@energonsolar.mx', '8128617041', 'SAN PEDRO', 'NUEVO LEON', false),
  ('3f07acef-a3c0-48de-a0f7-ddd52555845d', 'moral', 'CONCRETOS HUASTECA, S.A. DE C.V.', 'mago@concretoshuasteca.com', '8332664351', 'ALTAMIRA', 'TAMAULIPAS', false),
  ('66a1f177-5ea6-42e4-ae5a-10577d9f96e5', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (CASETA OSMOSIS JMAS SEC.FED 14)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('ea7e47e4-9eb0-4ebd-8b82-32ba1ce2334d', 'moral', 'CENTRO DE SERVICIOS SA DE CV', 'sortiz.suncorp@gmail.com', '6141191757', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('7698eca2-07f8-4d05-8701-2f7800e8936e', 'fisica', 'CRISTINA REYES PEREZ', 'jr8852659@gmail.com', '8712112296', 'GÓMEZ PALACIO', 'DURANGO', false),
  ('a8fa03f2-1b46-4f2b-89c2-87d92146f114', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (PLANTA 2)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('09e31469-4fb1-436b-b367-426fc5272529', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (PLANTA 1)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('d3f40b2f-f774-4646-b4ac-ef5d105e5e5d', 'moral', 'C U E D L AC', 'uvie@hotmail.com', '3312814594', 'GUADALAJARA', 'JALISCO', false),
  ('b70aab5e-b1df-4eb2-b688-3c74cf9d2c83', 'fisica', 'LUIS ARTURO ESQUIVEL GRACIDA', NULL, '8184027578', 'SAN JUAN DE SABINAS', 'COAHUILA', false),
  ('ed1c284c-ef94-4b9e-9468-eb21ce51153b', 'fisica', 'GABRIELA TRESPALACIOS LOZANO', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('24cd8deb-6ca1-4310-8579-4fbb6dc93c97', 'fisica', 'OSCAR GERARDO SOLBES DECANINI', 'contabilidad@grupoescena.com', '8333119234', 'TAMPICO', 'TAMAULIPAS', false),
  ('264bf589-d9ff-4817-affb-5039380b2865', 'fisica', 'JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAREZ (PLANTA 3)', 'luis@sis-energy.com', '6144067963', 'JUAREZ', 'CHIHUAHUA', false),
  ('9b518c30-7b88-467d-8690-85d1f1fd0cc0', 'fisica', 'DAVALOS MEDINA ZULMA BRIGETTE', 'ilusoledventas@hotmail.com', '3781015381', 'UNION DE SAN ANTONIO', 'JALISCO', false),
  ('b6a4abc6-2e88-4d3f-84ec-d6688f9f674d', 'fisica', 'AUDITORIA SUPERIOR DEL ESTADO', 'maria.estrada@asetamaulipas.gob.mx', '8120003308', 'VICTORIA', 'TAMAULIPAS', false),
  ('4a675783-a859-4042-b16d-4a19e5c8cef5', 'moral', 'MAQUINADOS DE SALTILLO SA DE CV', 'admin@solenergy.com.mx', '8444600263', 'SALTILLO', 'COAHUILA', false),
  ('d9b06af4-6c94-4887-b89b-13a122ab4b8b', 'moral', 'GORDITAS EL ATORON DE SA DE CV', 'velovidad_avt@hotmail.com', '6561420833', 'JUAREZ', 'CHIHUAHUA', false),
  ('5b5c7b6e-7784-438d-a9a1-2b75c982839f', 'fisica', 'DENISSE ALEJANDRA VELASQUEZ ROMERO', 'juan@delaree.com', '8112446770', 'HERMOSILLO', 'SONORA', false),
  ('610f7e24-0303-4abd-b8d8-04d64495a7d6', 'fisica', 'RODOLFO GONZALEZ IGLESIAS', 'facturaslicoresteivi@gmail.com', '6251214161', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('053f0aa1-31fb-4e05-a082-bd8d8bdc0e9d', 'fisica', 'GSF FITNESS', 'dcorral@trinova.com.mx', '6141926002', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('9577f8e2-85a5-46f7-b2a5-3f076f8a6c56', 'fisica', 'JOSE BENITO SALDIVAR ACOSTA', 'babu.902010@hotmail.com', '8999565279', 'REYNOSA', 'TAMAULIPAS', false),
  ('0ff63603-65ba-47aa-b119-5c143394ae58', 'moral', 'CAMIONERA DE JALISCO SA DE CV', 'adm.toritos@gmail.com', '3312615898', 'TEPATITLAN DE MORELOS', 'JALISCO', false),
  ('c120c13b-5332-4348-b64e-c56d0c8232d9', 'fisica', 'AYALA MICHEL FRANCISCO', 'mportillob@amds.com', '3322239244', 'EL SALTO', 'JALISCO', false),
  ('eb05ebf9-c296-4440-b0d9-b532295880f9', 'fisica', 'EMPAQ Y COMER LA TRADICIONAL', 'cecyll@gmail.com', '8341552663', 'VICTORIA', 'TAMAULIPAS', false),
  ('dba6baa6-09a3-4d9f-b9de-e2ca104ed723', 'fisica', 'LOS MOLINOS EN ACCION ASOCIACION CIVIL', 'miguel.fuentes@fuvasolar.com', '8443004986', 'SALTILLO', 'COAHUILA', false),
  ('9b93df84-9570-43a0-867a-a22d74a83dae', 'fisica', 'PROCESADORA Y EMPACADORA GANADERA DE SONORA SAPI DE CV', 'juan@delaree.com', '8112446770', 'HERMOSILLO', 'SONORA', false),
  ('ccb5aa73-40fd-4be1-804d-8e232d0dffb6', 'moral', 'MULTI ESPUMAS SA DE CV', 'uvie@hotmail.com', '3312814594', 'Tlajomulco de Zúñiga', 'JALISCO', false),
  ('ccf91ca3-9f4a-4c53-a157-ead0b6610dad', 'moral', 'CONDOMINIO V MARINA VALLARTA A.C.', 'uvie@hotmail.com', '3312814594', 'PUERTO VALLARTA', 'JALISCO', false),
  ('7fbaca51-5dba-45a7-8889-2801b509a1d0', 'fisica', 'SEMINARIO ARQUIDIOCESANO DE CHIHUAHUA AR', 'sajuma@live.com', '6141336622', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('c21056f2-b8b4-4d3c-a958-9cca741d1b9b', 'fisica', 'FABIAN REYNA MENDEZ', 'electroserviciosegz@gmail.com', '8781089422', 'ACUÑA', 'COAHUILA', false),
  ('265546ee-d21d-4465-bedc-698f70452a7c', 'moral', 'POWER PROCESS CONTROL, S.A. DE C.V.', 'crosas@ppcsesco.com', '8332411880', 'TAMPICO', 'TAMAULIPAS', false),
  ('a710451e-a1e5-479b-9ea1-fba3bbe1ed42', 'moral', 'FABRICA DE JABON LA CORONA SA DE CV', 'jesusmeneses1993@gmail.com', '6621682070', 'HERMOSILLO', 'SONORA', false),
  ('3cf679eb-52b6-4a35-8e4d-75633a3afd0e', 'fisica', 'VILLARREAL DE LOS REYES ZAIDA', 'ZAIDA.VILLARREAL@GMAIL.COM', '8681814233', 'VICTORIA', 'TAMAULIPAS', false),
  ('c307d93f-3a3e-4781-8878-485509dad9f0', 'fisica', 'JORGE ALBERTO FUENTES HERNANDEZ', 'agustin.esquivel@ecnl.com.mx', '8112198109', 'MONTEMORELOS', 'NUEVO LEÓN', false),
  ('e0a52c03-00c1-4a12-898b-606a006cdf03', 'fisica', 'PRODUCTOS LAMINADOS DE PINO Y ENCINO S. DE R.L.MI', 'edgargregorioperez@hotmail.com', '6141048882', 'CHIHUAHUA', 'CHIHUAHUA', false),
  ('bdeff44e-ccff-4f91-ab61-9947740e7543', 'moral', 'SERVICIOS DE MAQUINADO Y REFACCIONES DE IMURIS SRL DE CV', 'iecindustrial@gmail.com', '6413210056', 'IMURIS', 'SONORA', false),
  ('40871c5f-0cae-46a3-a656-b8f08770b4ac', 'moral', '7-ELEVEN MEXICO S.A. DE C.V.', 'admin@helasolar.com', '3324795740', 'Tlaquepaque', 'Jalisco', false),
  ('d35ba77e-5f66-4f8f-a668-1781c8c0eeca', 'moral', 'ENTROQUE SANTA CLARA SA DE CV', 'rleon@legaxxi.com', '6622816419', 'GUAYMAS', 'SONORA', false),
  ('e124092b-97c8-43ae-9712-f7e191f54c42', 'fisica', 'ORGANO SUPERIOR DE AUDITORÍA Y FISCALIZACIÓN GUBERNAMENTAL DEL ESTADO', 'uvie@hotmail.com', '3312814594', 'Colima', 'COLIMA', false),
  ('2e59b6ce-9eba-4ce3-8f73-f7f80451f7d9', 'moral', 'G.S.W. DE MEXICO S DE RL DE CV', 'ariadnal@gswiring.com', '8991707103', 'REYNOSA', 'TAMAULIPAS', false),
  ('3433923a-55b3-4d82-9a2f-9cb05831b0b2', 'fisica', 'REGINO TREVIÑO CASTRO', 'r.treviño.castro@hotmail.com', '8333356517', 'ALTAMIRA', 'TAMAULIPAS', false),
  ('3fb69784-060a-4274-ae07-8b42f5256851', 'moral', 'BURGOS PLUS GASOLINERAS S.A DE C.V.', 'gensacontabilidad@burgosplus.com.mx', '8999708700', 'REYNOSA', 'TAMAULIPAS', false),
  ('39d0b62b-446a-4e48-b8c6-55a8f9c74ff3', 'fisica', 'CRUZ HERRERA ROSA MARIA', 'jairo1279@gmail.com', '6141421671', 'DELICIAS', 'CHIHUAHUA', false),
  ('18170710-0330-4835-b66a-3137b8036506', 'moral', 'GDL CORRUGADOS S.A. DE C.V.', 'direccion@solumex.net', '6871334831', 'LA CAPILLA', 'JALISCO', false),
  ('a568409e-78f2-4d0a-876a-18f8f97c7353', 'fisica', 'SARA JUDITH IZAGUIRRE FARIAS', 'lwyz2000@hotmail.com', '8442807930', 'SAN JUAN DE SABINAS', 'COAHUILA', false),
  ('43ad9cf4-6b9c-4023-8c8d-9a9e58a9b318', 'moral', 'LENOMEX SA DE CV', 'cavidu@gmail.com', '8712117665', 'SANTA CATARINA', 'NUEVO LEÓN', false),
  ('97fb9c1a-91a6-41b1-a6db-200f3e8b3b6c', 'fisica', 'FEHR HILDEBRAND WILHELM', 'magaly_170293@hotmail.com', '6142883325', 'CUAUHTEMOC', 'CHIHUAHUA', false),
  ('67349495-36cf-4a34-b37f-f7bbc3ad95d6', 'moral', 'ALMACENES IBARRA SA DE CV', 'gerardo.enriquez@genergy.com', '8341491326', 'TAMPICO', 'TAMAULIPAS', false),
  ('153ea29f-98c1-4920-80d6-3115e54ebdb4', 'moral', 'COMERCIAL LLANTERA TAPATIA S.A. DE C.V.', 'hrodriguez.mevic@gmail.com', '3326556789', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', false),
  ('4fb0dda3-3872-4b67-8cfa-6328bee92284', 'fisica', 'MARIA DE JESUS YAÑEZ SILVA', 'federico.rios73@gmail.com', '8116349935', 'APODACA', 'NUEVO LEON', false),
  ('c579bb02-99bb-48af-8d32-d4937f6d15c8', 'fisica', 'LUIS GERARDO ZERTUCHE SANTILLAN', 'gerardozertuche22mala@live.com.mx', '8621094885', 'ALLENDE', 'NUEVO LEON', false)
ON CONFLICT DO NOTHING;

-- ── 4. Expedientes + Inspecciones históricos (352) ───
DO $$
DECLARE
  v_folio_id UUID;
  v_exp_id   UUID;
BEGIN

  -- UIIE-1448-2025 — WALDOS DOLAR MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1448-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1448-2025', 11448, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1448-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '8e7fdaa1-04f0-4019-a49b-cc9a612606d4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1448-2025', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c54046e0-e4b9-4b36-8823-f425ea217263', 49.3, 'AV GONZALEZ ORTEGA NO. 201 , CENTRO, ZACATECAS, ZACATECAS , CP. 98000', 'ZACATECAS', 'ZACATECAS', 'cerrado', '2026-01-03', '2026-01-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV GONZALEZ ORTEGA NO. 201 , CENTRO, ZACATECAS, ZACATECAS , CP. 98000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1319-2025 — JESUS ANGEL MONTEMAYOR JARAMILLO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1319-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1319-2025', 11319, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1319-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '48bfec34-a1ae-45b6-aee8-44546efc10e9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1319-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'b7525f3f-a444-4af6-a870-4d37c2fc052b', 20.47, 'MATAMOROS 140, ZUAZUA 67277 ZUAZUA NUEVO LEON', 'ZUAZUA', 'NUEVO LEON', 'cerrado', '2025-12-22', '2025-12-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MATAMOROS 140, ZUAZUA 67277 ZUAZUA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-151-2026 — SALVADOR SANCHEZ GOMEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-151-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-151-2026', 151, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-151-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '43008e94-2e56-46dd-8f2b-bde53157b587';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-151-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '24db1776-8aa3-42e1-8820-aa9176c43db9', 98.12, '5A SAN ANTONIO No 2, UNIDAD HABIT MILITAR, Tapachula, Chiapas, CP. 30780', 'Tapachula', 'Chiapas', 'cerrado', '2026-01-21', '2026-01-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-21T09:00:00-07:00'::TIMESTAMPTZ, 180, '5A SAN ANTONIO No 2, UNIDAD HABIT MILITAR, Tapachula, Chiapas, CP. 30780', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-149-2026 — CARLOS ANTONIO LUTTMAN FOX
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-149-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-149-2026', 149, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-149-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'd7960c7d-951e-495c-8123-4e34ec50cd2b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-149-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '85b60521-797e-45db-85fa-e21ec0fedc9f', 11.34, '5A EL REFUGIO S7N, BELLA VISTA, Tapachula, Chiapas, CP. 30700', 'Tapachula', 'Chiapas', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, '5A EL REFUGIO S7N, BELLA VISTA, Tapachula, Chiapas, CP. 30700', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-141-2026 — 7-ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-141-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-141-2026', 141, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-141-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'd4ffa141-53bd-452b-9679-f0d9f25b1115';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-141-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '456dc9ec-5a44-4468-bb0e-703e1470bc41', 13.45, 'AMERICAS No.1637, COLONIA PROVIDENCIA, GUADALAJARA, JALISCO, CP. 44630', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AMERICAS No.1637, COLONIA PROVIDENCIA, GUADALAJARA, JALISCO, CP. 44630', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-150-2026 — CHIAPAS SIGLO XXI SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-150-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-150-2026', 150, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-150-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '276b43a6-900a-4274-82a2-e6cece5739ab';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-150-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '07b9c52c-0656-4e11-b45f-dcca1b6d94e6', 13.31, 'CAMINO AL PORVENIR S/N, PORVENIR, Tapachula, Chiapas, CP. 30750', 'Tapachula', 'Chiapas', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO AL PORVENIR S/N, PORVENIR, Tapachula, Chiapas, CP. 30750', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-208-2026 — GUILLERMO OMAR GIM BURRUEL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-208-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-208-2026', 208, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-208-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '0a618359-2dd5-40da-90aa-cc03ca0e28cb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-208-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '3248763a-a0af-4ba0-8649-8580ffa164d8', 17.36, 'TERRENATE No.9A, COLONIA LAS PRADERAS, NOGALES, SONORA, CP. 84064', 'NOGALES', 'SONORA', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'TERRENATE No.9A, COLONIA LAS PRADERAS, NOGALES, SONORA, CP. 84064', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-059-2026 — MARIA GUADALUPE ELIZONDO GUTIERREZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-059-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-059-2026', 59, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-059-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '54715de1-1cad-47aa-86a4-d5e70b12de46';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-059-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '3e564608-d21f-4c1e-8d71-53dec13e26fa', 33.32, 'RIO NILO 117, DEL VALLE 66220, SAN PEDRO GARZA GARCIA, NUEVO LEON', 'SAN PEDRO', 'NUEVO LEON', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RIO NILO 117, DEL VALLE 66220, SAN PEDRO GARZA GARCIA, NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-064-2026 — MARTHA ELENA LOPEZ JIMENEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-064-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-064-2026', 64, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-064-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '163453e2-e152-4235-9337-41366719c172';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-064-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'd64cefe3-fc44-4ea4-8433-1fe8c00eb70d', 7.26, 'QUINTA REAL 567, VALLE REAL SALTILLO COAHUILA DE ZARAGOZA 25205', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'QUINTA REAL 567, VALLE REAL SALTILLO COAHUILA DE ZARAGOZA 25205', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1449-2025 — WALDOS DOLAR MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1449-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1449-2025', 11449, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1449-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '9026093d-1c1a-4b20-a1b9-ab5f594f3dd6';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1449-2025', '5c207af9-2054-457f-893e-5e16427aae52', 'c54046e0-e4b9-4b36-8823-f425ea217263', 36, 'AVE LAURO VILLAR No 1319, GUILLERMO GUAJARDO, MATAMOROS, TAMAULIPAS, CP. 87447', 'MATAMOROS', 'TAMAULIPAS', 'cerrado', '2026-01-04', '2026-01-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE LAURO VILLAR No 1319, GUILLERMO GUAJARDO, MATAMOROS, TAMAULIPAS, CP. 87447', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1447-2025 — PALETAS MARA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1447-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1447-2025', 11447, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1447-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'd2f73e7d-4779-4ff9-a9a5-6037f1ec4cfa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1447-2025', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '9efff6bd-7387-4f70-bfd6-e85b6c9b27c6', 310, 'Carretera Federal 70 km 88, Mesa de Santiago, JALPA, ZACATECAS, CP. 99600', 'JALPA', 'ZACATECAS', 'cerrado', '2026-01-03', '2026-01-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Carretera Federal 70 km 88, Mesa de Santiago, JALPA, ZACATECAS, CP. 99600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1450-2025 — ARNESES ELECTRICOS AUTOMOTRICES S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1450-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1450-2025', 11450, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1450-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'c09804cc-a044-433f-90fa-f67958db96f9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1450-2025', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '38b4fc08-aac8-4b0a-bff2-7ebacb86c7d2', 137.76, 'CARR SILAO IRAP KM 146.5 , ZONA CENTRO SILAO, SILAO, GUANAJUATO, CP. 36100', 'SILAO', 'GUANAJUATO', 'cerrado', '2026-01-04', '2026-01-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR SILAO IRAP KM 146.5 , ZONA CENTRO SILAO, SILAO, GUANAJUATO, CP. 36100', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-001-2026 — ALIMENTOS BALANCEADOS AGPI S.P.R. DE R.L. DE 
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-001-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-001-2026', 1, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-001-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'a7580753-0e4d-46de-ae47-f03d19468382';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-001-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '72c0e440-3b72-4d76-adc1-45216eb385d3', 496, 'PARCELA No. 375, CP. 27993, COLONIA STA ISABEL POR PRR', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-06', '2026-01-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PARCELA No. 375, CP. 27993, COLONIA STA ISABEL POR PRR', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-002-2026 — GRUPO TRACOM S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-002-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-002-2026', 2, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-002-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '806aecd7-0331-4622-8b0b-15d0fbe03dd4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-002-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '627216f4-b406-4704-9b1e-ca4d0964438e', 11.5, 'CALZ. LA RIVERENA No. 500, CP. 27108, COL. LA UNIÓN', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALZ. LA RIVERENA No. 500, CP. 27108, COL. LA UNIÓN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1406-2025 — RAUL ARMANDO JARAMILLO LEAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1406-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1406-2025', 11406, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1406-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'e3975004-1e84-47db-943b-87fedd6d9f1f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1406-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '18e87ede-8292-4339-a97b-2f33dc6bf764', 31, 'LAURO AGUIRRE No 721, CENTRO TAMATAN, C.P. 87048 Victoria Tamaulipas', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2025-12-04', '2025-12-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2025-12-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LAURO AGUIRRE No 721, CENTRO TAMATAN, C.P. 87048 Victoria Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1412-2025 — HECTOR SALVADOR GONZALEZ LOZANO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1412-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1412-2025', 11412, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1412-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '0a632d43-c5b4-4860-b583-16ac88f8354f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1412-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'ef904a1c-34c6-4a0e-a8b5-0a5cb828be09', 27.5, 'CARR SLM LA PESCA KM 42 500 No 0, LA PESCA, C.P. 87678 SOTO LA MARINA, TAMAULIPAS', 'SOTO LA MARINA', 'TAMAULIPAS', 'cerrado', '2025-12-08', '2025-12-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2025-12-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR SLM LA PESCA KM 42 500 No 0, LA PESCA, C.P. 87678 SOTO LA MARINA, TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-003-2026 — COLEGIO DE CONTADORES PUBLICOS DE LA LAGUNA A
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-003-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-003-2026', 3, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-003-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'ecfe12d9-f753-464e-b0b7-6e385b47e596';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-003-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'f1c35498-b123-4a5e-bf7c-a3176ed5c1db', 30, 'AV. ALLENDE No. 4799, CP. 27000, COL. VILLA CALIFORNIA', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. ALLENDE No. 4799, CP. 27000, COL. VILLA CALIFORNIA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-024-2026 — BLANCA ESTHELA PEREZ TOSTADO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-024-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-024-2026', 24, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-024-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '4a8f33c8-5752-49d9-aac7-63056ae47ae2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-024-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c78fadcf-872f-4778-b9a9-8766e07d8696', 15, 'AV. FUNDADORES No. 69, CP. 35015, MIRAVALLE FRACC GOL', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. FUNDADORES No. 69, CP. 35015, MIRAVALLE FRACC GOL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-011-2026 — JULISA MORAYMA ESPARZA RIOS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-011-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-011-2026', 11, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-011-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '4dab962b-9e4e-4df8-aa4e-fbded33b5200';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-011-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'd33670ce-6e96-4017-9aac-cddee15134cd', 9, 'C. 15 A 904 A, RANCHERIA JUAREZ, Chihuahua, Chihuahua, C.P. 31064', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. 15 A 904 A, RANCHERIA JUAREZ, Chihuahua, Chihuahua, C.P. 31064', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1382-2025 — ENRIQUE VAZQUEZ TAMEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1382-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1382-2025', 11382, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1382-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '9b32abff-e3fa-404d-a14b-dd5f373d00ef';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1382-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '7e8a89fb-ff16-45af-b5ce-aa0eaaace30a', 22, 'C SAN FRANCISCO NO. 100 INT 20 LAS COLINAS RESID 64639 MONTERREY NUEVO LEON', 'MONTERREY', 'NUEVO LEON', 'cerrado', '2025-11-28', '2025-11-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-11-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C SAN FRANCISCO NO. 100 INT 20 LAS COLINAS RESID 64639 MONTERREY NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-010-2026 — INDUSTRIALIZADORA SANZUBIA S.A. DE C.V
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-010-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-010-2026', 10, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-010-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'eb74ee1c-6b78-4bcb-86ff-d132f057b343';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-010-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '13c75784-939d-4a37-8c62-71d8abc48cac', 111, 'CARR PANAMERICANA KM 129 GRANJAS FAMILIARES S/N , INDUSTRIAL SUR, Delicias, Chihuahua, C.P. 33105', 'DELICIAS', 'CHIHUAHUA', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR PANAMERICANA KM 129 GRANJAS FAMILIARES S/N , INDUSTRIAL SUR, Delicias, Chihuahua, C.P. 33105', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-004-2026 — KOSSIO NAVARRO SERGIO ARMANDO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-004-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-004-2026', 4, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-004-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '5ec0da65-a4b7-4e70-9de6-61edb66b2543';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-004-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '437ca3f2-f7fd-49a2-9edd-a4a440068b48', 17.36, 'DE LA CALANDRIA No.46, COLONIA LAGO ESCONDIDO, HERMOSILLO, SONORA, CP. 83245', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-06', '2026-01-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DE LA CALANDRIA No.46, COLONIA LAGO ESCONDIDO, HERMOSILLO, SONORA, CP. 83245', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-045-2026 — GRANJA SIERRA OBSCURA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-045-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-045-2026', 45, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-045-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'ebb11114-159c-4906-a17f-68ffaf6276ea';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-045-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'c4f4ae51-004d-42d9-a943-790d63e8aeee', 140, 'C NAV MOCHIS KM 14 S/N, PARQUE INDUSTRIAL, NAVOJOA, SONORA, CP. 85895', 'NAVOJOA', 'SONORA', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C NAV MOCHIS KM 14 S/N, PARQUE INDUSTRIAL, NAVOJOA, SONORA, CP. 85895', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-046-2026 — ALIANZA PARA LA PRODUCCIÓN SOLES S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-046-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-046-2026', 46, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-046-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '0116e6ce-e13e-4a2d-8f46-2ecaac0366bf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-046-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '418c5ef3-cd8a-43f2-b033-ea12db04faf5', 210, 'Camino a Movas KM 13 S/N, El Sauz, CAJEME, SONORA, CP. 85716', 'CAJEME', 'SONORA', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Camino a Movas KM 13 S/N, El Sauz, CAJEME, SONORA, CP. 85716', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-039-2026 — GONVAUTO PUEBLA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-039-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-039-2026', 39, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-039-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '45f3baf6-aab4-45a3-a0e6-12e0581c9c8e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-039-2026', '5c207af9-2054-457f-893e-5e16427aae52', '6c9e1776-35c6-44cc-b491-9006e433a6b6', 480, 'AUTOMOCION No. 9, PARQUE INDUST FINSA 07G, CUAUTLANCINGO, PUEBLA, C.P. 72710', 'CUAUTLANCINGO', 'PUEBLA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AUTOMOCION No. 9, PARQUE INDUST FINSA 07G, CUAUTLANCINGO, PUEBLA, C.P. 72710', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-038-2026 — GONVAUTO PUEBLA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-038-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-038-2026', 38, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-038-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'd686902f-2870-4d9c-840d-e3cb01e01c7e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-038-2026', '5c207af9-2054-457f-893e-5e16427aae52', '6c9e1776-35c6-44cc-b491-9006e433a6b6', 460, 'AUTOMOCION No. 8, PARQUE INDUST FINSA, CUAUTLANCINGO, PUEBLA, C.P. 72710', 'CUAUTLANCINGO', 'PUEBLA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AUTOMOCION No. 8, PARQUE INDUST FINSA, CUAUTLANCINGO, PUEBLA, C.P. 72710', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-052-2026 — NUEVA WAL MART DE MEXICO S. DE R. L. DE C. V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-052-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-052-2026', 52, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-052-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'd472bc85-b807-498d-993b-4a8520177c65';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-052-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'd310a26f-cb97-4a3a-8735-4779636d012d', 399.6, 'AV ALVARO OBREGON No 4080, NUEVO NOGALES NGL, NOGALES, SONORA, CP. 84094', 'NOGALES', 'SONORA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV ALVARO OBREGON No 4080, NUEVO NOGALES NGL, NOGALES, SONORA, CP. 84094', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-025-2026 — ENRIQUE HERNANDEZ PACHECO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-025-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-025-2026', 25, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-025-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '4064a546-e546-4567-afcf-c47fb7b7a3d7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-025-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '964a4bc9-142f-4762-a6bf-812fa28660c4', 20, 'PRINCIPAL EJIDO COYOTE, S/N, CP. 27450, EL COYOTE', 'FRANCISCO I MADERO', 'COAHUILA', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRINCIPAL EJIDO COYOTE, S/N, CP. 27450, EL COYOTE', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-030-2026 — SAL SERVICIOS GASTRONOMICOS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-030-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-030-2026', 30, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-030-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '55d0e2bc-be78-4024-87ff-0bda38f2038f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-030-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '7bac8ed2-0a1c-4099-bb65-736398f1dc2c', 14.3, 'BLVD INDEPENDENCIA No. 3545 OTE, INT 14, CP. 27018, EL FRESNO RES FRACC TRN', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD INDEPENDENCIA No. 3545 OTE, INT 14, CP. 27018, EL FRESNO RES FRACC TRN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1150-2025 — LEGIONARIOS DE CRISTO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1150-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1150-2025', 11150, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1150-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '2ca1e0d1-ed74-40fd-a5ed-fae574732a25';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1150-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '4b124335-3ce1-409c-9f70-f4e9dc77bbee', 181.13, 'CARR NACIONAL KM 266 PORTAL DE HUAJUCO 67989, MONTERREY NUEVO LEON', 'MONTERREY', 'NUEVO LEON', 'cerrado', '2025-11-24', '2025-11-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-11-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR NACIONAL KM 266 PORTAL DE HUAJUCO 67989, MONTERREY NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-017-2026 — DINAMICA EMPRESARIAL VETERINARIA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-017-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-017-2026', 17, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-017-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'b3cac86a-af97-4fce-9a3f-1bd03aeb58bf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-017-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'f0f54a5c-3b47-44b6-9daf-384c204cefae', 30, 'C CARLOS ARCE ARZATE LOTE 1, MACIAS ARELLANO, C.P. 20150, AGUASCALIENTES, AGUASCALIENTES.', 'AGUASCALIENTES', 'AGUASCALIENTES', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C CARLOS ARCE ARZATE LOTE 1, MACIAS ARELLANO, C.P. 20150, AGUASCALIENTES, AGUASCALIENTES.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-012-2026 — LUIBO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-012-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-012-2026', 12, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-012-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '81f1170f-14b5-41bf-9b45-7896133cd797';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-012-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '63de90c5-fae9-4256-a19b-e87d44628348', 160, 'PERIFERICO GOMEZ MORIN KM 14 700 S/N , CAMPO 22, Cuauhtémoc, Chihuahua, C.P. 31607', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PERIFERICO GOMEZ MORIN KM 14 700 S/N , CAMPO 22, Cuauhtémoc, Chihuahua, C.P. 31607', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-026-2026 — GUILLERMO AVALOS GONZALEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-026-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-026-2026', 26, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-026-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '196662b9-89fa-4bde-ac46-6434ad9a9667';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-026-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '561392b0-fa2c-4d09-8e8d-4fff27bcf057', 6, 'CALLEJON DE LOS BARANDALES No. 311, CP. 27250, CAMPESTRE LA ROSITA', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLEJON DE LOS BARANDALES No. 311, CP. 27250, CAMPESTRE LA ROSITA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-027-2026 — MAURICIO CAMPA CRUZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-027-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-027-2026', 27, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-027-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '0d70a02b-2d3f-4262-b2be-37abdf39be6d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-027-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '30e89e68-d105-4556-b332-96e9f44cf93d', 70.6, 'CALZ MOCTEZUMA No. 225, CP. 27030, COL. MOCTEZUMA', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALZ MOCTEZUMA No. 225, CP. 27030, COL. MOCTEZUMA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-029-2026 — HUMBERTO CARLOS TOHME CANALES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-029-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-029-2026', 29, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-029-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '3dd3556b-1254-4105-8282-45af55845d3d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-029-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c8245d0f-daf9-4de9-8260-6ff57eed87de', 9.8, 'CERRADA SAN ANTONIO No. 4270, CP. 27018,  EL FRESNO RES FRACC', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CERRADA SAN ANTONIO No. 4270, CP. 27018,  EL FRESNO RES FRACC', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-049-2026 — OPERADORA DE CINEMAS S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-049-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-049-2026', 49, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-049-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '4c52f928-30d5-458c-80ab-6201b6112452';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-049-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'a8a565ec-d10a-4bce-8330-fd8ba3dd4a5e', 146.2, 'AVENIDA JUAREZ SUR No. 33, BARRIO DE ATEMPA, TIZAYUCA, HIDALGO, C.P. 43808', 'TIZAYUCA', 'HIDALGO', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVENIDA JUAREZ SUR No. 33, BARRIO DE ATEMPA, TIZAYUCA, HIDALGO, C.P. 43808', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-042-2026 — GUADALUPE JIMENEZ HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-042-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-042-2026', 42, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-042-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '993f7e81-0ca8-4819-b8ca-a4e1ebcf23b1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-042-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '5ea2247c-e34e-4ad0-b185-d24355ca71a2', 15.08, 'POZO AGUA POTABLE, S/N, CP. 94240, EL MIRADOR', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'POZO AGUA POTABLE, S/N, CP. 94240, EL MIRADOR', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-014-2026 — RIGOBERTO SALCIDO PONCE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-014-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-014-2026', 14, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-014-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'a5987682-ba8c-4ea3-93bf-dd54df159d74';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-014-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '5d5eec00-e5b7-4b9b-b4f2-cc100cf0985f', 10, 'AV. NICOLAS BRAVO S/N , VALLE DE ZARAGOZA, Valle de Zaragoza, Chihuahua, C.P. 33650', 'VALLE DE ZARAGOZA', 'CHIHUAHUA', 'cerrado', '2026-01-12', '2026-01-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. NICOLAS BRAVO S/N , VALLE DE ZARAGOZA, Valle de Zaragoza, Chihuahua, C.P. 33650', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-076-2026 — UREBLOCK SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-076-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-076-2026', 76, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-076-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '933d4cda-cf4c-4d18-b4fc-f990f0402dea';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-076-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'ffdec036-999d-4108-a001-f105430be2fc', 102, 'CTRA STA ROSA LA BCA KM 31 No.42, COLONIA PONCITLAN CENTRO, PONCITLAN, JALISCO, CP. 45950', 'PONCITLAN', 'JALISCO', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CTRA STA ROSA LA BCA KM 31 No.42, COLONIA PONCITLAN CENTRO, PONCITLAN, JALISCO, CP. 45950', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-075-2026 — CHAD PETER DOETZEL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-075-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-075-2026', 75, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-075-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'e6524765-7b13-45c9-9a87-fb65181f8ff5';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-075-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '3744c4dd-e833-4e46-bfc9-05e9e23a838b', 19.68, 'CARR LA CRUZ DE HUANACAXT PTA S/N, COLONIA PUNTA DE MITA, BAHIA DE BANDERAS , NAYARIT, CP. 63734', 'BAHIA DE BANDERAS', 'NAYARIT', 'cerrado', '2026-01-05', '2026-01-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR LA CRUZ DE HUANACAXT PTA S/N, COLONIA PUNTA DE MITA, BAHIA DE BANDERAS , NAYARIT, CP. 63734', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-068-2026 — UNIVERSIDAD AUTONOMA DE AGUASCALIENTES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-068-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-068-2026', 68, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-068-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '740654d8-6bf6-474a-ad52-e6c2db613835';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-068-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '92c85bac-7081-4443-b2a7-98d3da191b19', 45, 'ESCUELA VETERINARIA Y ZOOTECNIA LA POSTA S/N, JESUS MARIA CENTRO, C.P. 20920, JESUS MARIA, AGUASCALIENTES.', 'JESUS MARIA', 'AGUASCALIENTES', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ESCUELA VETERINARIA Y ZOOTECNIA LA POSTA S/N, JESUS MARIA CENTRO, C.P. 20920, JESUS MARIA, AGUASCALIENTES.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1416-2025 — ROSAURA AGUILAR DE LA FUENTE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1416-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1416-2025', 11416, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1416-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'f26c380d-e24d-42dd-9083-054eb903781d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1416-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'b3ea215b-d97a-46cf-9dc8-9c63e0cefa74', 40.26, 'BLV L E ALVAREZ No 1405 Int B, MILLER, C.P. 89880 EL MANTE TAMAULIPAS', 'MANTE', 'TAMAULIPAS', 'cerrado', '2025-12-11', '2025-12-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2025-12-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLV L E ALVAREZ No 1405 Int B, MILLER, C.P. 89880 EL MANTE TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-058-2026 — JESUS MELQUIADES BERDON MARTINEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-058-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-058-2026', 58, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-058-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '65f748df-1b79-4275-a707-dd59b77c8f68';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-058-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '9c2bd4bc-b730-4582-b628-99c18c77575e', 10, 'RCHO. ROSITA EJIDO LUZ DEL C No 145, EST. SANTA ENGRACIA, C.P. 87849 Hidalgo Tamaulipas', 'HIDALGO', 'TAMAULIPAS', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RCHO. ROSITA EJIDO LUZ DEL C No 145, EST. SANTA ENGRACIA, C.P. 87849 Hidalgo Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1424-202 — LIEBHERR MTY S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1424-202';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1424-202', 99999, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1424-202'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'c304b639-2f93-4b78-bb08-c9c03b6c51c1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1424-202', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '99b769c8-5126-4cb7-9f0b-5581efb95c4a', 499, 'CARR VILLA DE GARCIA SN NO. 133 CENTRO VILLA DE GARCIA 66000 GARCIA NUEVO LEON', 'GARCIA', 'NUEVO LEON', 'cerrado', '2025-12-05', '2025-12-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR VILLA DE GARCIA SN NO. 133 CENTRO VILLA DE GARCIA 66000 GARCIA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1425-2025 — JOSE PABLO GARZA PEREZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1425-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1425-2025', 11425, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1425-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '74814fba-f0a3-414c-bd68-65d7aeefe418';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1425-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '149d1042-4d1d-47bc-aca6-7e4c40bea242', 9.87, 'PRIV ONIX 150 PEDREGAL DEL VALLE 66280 SAN PEDRO GARZA GARCIA NUEVO LEON', 'SAN PEDRO', 'NUEVO LEON', 'cerrado', '2025-12-10', '2025-12-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRIV ONIX 150 PEDREGAL DEL VALLE 66280 SAN PEDRO GARZA GARCIA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-020-2026 — JTA MPAL AGUA Y SMTO GUACHOCHI
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-020-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-020-2026', 20, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-020-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '5545e094-3fe6-47d8-aa35-c2794875774b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-020-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '7fc0f2b8-a804-4c2c-aafe-bc0389d87edf', 60, 'C. PRIMERA S/N POZO 2, LAS TRUCHAS, Guachochi, Chihuahua, C.P. 33180', 'GUACHOCHI', 'CHIHUAHUA', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. PRIMERA S/N POZO 2, LAS TRUCHAS, Guachochi, Chihuahua, C.P. 33180', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-053-2026 — AQUAHIELO DEL BAJIO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-053-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-053-2026', 53, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-053-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := 'f599c410-6ab2-4511-b085-31d514cc3a05';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-053-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'a4ce6448-8382-4cd9-b264-2ef37faa34b4', 496, 'HEROES DE LA INDEPENDENCIA #1037 COL EL COECILLO, LEON, GUANAJUATO C.P. 37260', 'LEON, GUANAJUATO', 'GUANAJUATO', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HEROES DE LA INDEPENDENCIA #1037 COL EL COECILLO, LEON, GUANAJUATO C.P. 37260', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-048-2026 — MARMIFERA STONE S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-048-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-048-2026', 48, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-048-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'b1b787e3-ea00-4ebd-9d30-9bd91890a0aa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-048-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'c62f3952-fbdc-4c58-9b25-211eefc54fc2', 146.83, 'AV. CAMINO SAN BUENAVENTURA, TEPEACA S/N, COL. SAN BUENAVENTURA, SAN
BUENAVENTURA, PUEBLA, C.P. 75258', 'SAN BUENAVENTURA', 'PUEBLA', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. CAMINO SAN BUENAVENTURA, TEPEACA S/N, COL. SAN BUENAVENTURA, SAN
BUENAVENTURA, PUEBLA, C.P. 75258', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-021-2026 — TRANSPORTES INDUSTRIALES VITA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-021-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-021-2026', 21, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-021-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'db0afac6-ec89-4fad-a557-ad9dac506e35';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-021-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '43437841-f2e9-487c-8c5f-88a9bf0264c3', 50, 'C. BARTON 11803 , NOGALES AEROPUERTО, Chihuahua, Chihuahua, C.P. 31380', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. BARTON 11803 , NOGALES AEROPUERTО, Chihuahua, Chihuahua, C.P. 31380', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-066-2026 — COMBUST CARRET CARCO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-066-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-066-2026', 66, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-066-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'bfb8e952-0131-4dee-a5f1-d3483ee4d48b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-066-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '7dd84a32-eda1-47da-a4f9-6f0e84f44ea3', 28.6, 'KM 95 700 AUTOPISTA GDL COLIMA S/N, PERIFERIA, C.P. 49000, ZAPOTILTIC, JALISCO.', 'ZAPOTILTIC', 'JALISCO', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'KM 95 700 AUTOPISTA GDL COLIMA S/N, PERIFERIA, C.P. 49000, ZAPOTILTIC, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-074-2026 — LUZ DEL CARMEN NORIEGA MUÑOZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-074-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-074-2026', 74, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-074-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'c55837f4-c364-4eb5-a16a-43e0be8a50e0';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-074-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '65b5e226-6e8b-400d-8974-04862e7a9914', 8, 'CAMINO DE LAS TURQUESAS No 2, LA JOLLA, HERMOSILLO, SONORA, CP. 83159', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-12', '2026-01-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO DE LAS TURQUESAS No 2, LA JOLLA, HERMOSILLO, SONORA, CP. 83159', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-044-2026 — MAQUINARIA MAGNUM S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-044-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-044-2026', 44, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-044-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '8a254f0c-66db-45aa-bf3f-536139af5fe9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-044-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'b6cbeca9-abf8-4dab-b8d8-ecc3ea08712d', 472, 'PARQUE IND LAS AMERICAS No. 220, CP. 27272, PARQUE IND OTE TRN', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PARQUE IND LAS AMERICAS No. 220, CP. 27272, PARQUE IND OTE TRN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-067-2026 — COB CARRETEROS CARCO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-067-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-067-2026', 67, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-067-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'f9da4607-0ab5-4a4a-8597-876f600e4e88';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-067-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '35b90303-5148-4807-b234-8f539951df2c', 28, 'KM 83 600 AUTOPISTA GDL COLIMA S/N, ATEQUIZAYAN, C.P. 49109, ZAPOTLAN EL GRANDE, JALISCO.', 'ZAPOTLAN EL GRANDE', 'JALISCO', 'cerrado', '2026-01-14', '2026-01-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'KM 83 600 AUTOPISTA GDL COLIMA S/N, ATEQUIZAYAN, C.P. 49109, ZAPOTLAN EL GRANDE, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-016-2026 — ORGANIZACIÓN REAL FOODS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-016-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-016-2026', 16, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-016-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'f011e8e7-5d95-4908-9332-57cd31495458';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-016-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '60a53d72-3d64-4ebf-b001-fcfed7923084', 494.1, 'CARR. PANAMERICANA KM 111.1 S/N , SAUCILLO, Saucillo, Chihuahua, C.P. 33620', 'SAUCILLO', 'CHIHUAHUA', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR. PANAMERICANA KM 111.1 S/N , SAUCILLO, Saucillo, Chihuahua, C.P. 33620', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-092-2026 — LOMA GEMA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-092-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-092-2026', 92, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-092-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '87fb1072-1868-4bb9-ab1f-aeddac322d8c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-092-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '83e89e97-6930-4656-84b9-7c632a163695', 70.29, 'PASEO RIO SONORA 76, LA MOSCA, HERMOSILLO, SONORA, CP. 83270', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PASEO RIO SONORA 76, LA MOSCA, HERMOSILLO, SONORA, CP. 83270', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-033-2026 — NIDO PARRAS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-033-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-033-2026', 33, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-033-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'ad07f482-1b85-485d-8585-23f35fa0e47e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-033-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '1fb1bec1-f99b-41bc-891b-da98e67d84ef', 36, 'BLVD. INDEPENDENCIA No. 3745, INT 11, CP. 27018, EL FRESNO RES FRACC', 'TORREON', 'COAHUILA', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. INDEPENDENCIA No. 3745, INT 11, CP. 27018, EL FRESNO RES FRACC', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-041-2026 — INMOBILIARIA BATARSE OFICIAL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-041-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-041-2026', 41, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-041-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'b8d635d3-d1a4-4223-a75b-9ddc83586734';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-041-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '8a1d9d5e-4fd5-466c-a4b3-abb6dad50d60', 28.28, 'RAFAEL AROCENA No. 22, CP. 27140, LOS ÁNGELES', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RAFAEL AROCENA No. 22, CP. 27140, LOS ÁNGELES', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-084-2026 — CONSTRUCTORA CAPUCCINO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-084-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-084-2026', 84, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-084-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '49a87e86-7cf9-4a38-8c88-dfdd4e628d9e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-084-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'dfcf8b1c-c32d-4cf4-92f1-49908cf34bdb', 10.98, 'RAMON VALDEZ No. 962, COLONIA UNION DE LADRILLEROS, HERMOSILLO, SONORA, CP. 83179', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RAMON VALDEZ No. 962, COLONIA UNION DE LADRILLEROS, HERMOSILLO, SONORA, CP. 83179', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-050-2026 — KUEHNE NAGEL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-050-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-050-2026', 50, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-050-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'cb17c446-9465-43ba-8f8c-de99d6fa3f3c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-050-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'ca69a536-f6c4-4e49-9c9b-a1019d219ee3', 496, 'CARR A TEPO LA AURORA KM1 SN No. 0, AXOTLAN, CUAUTITLAN IZCALLI, ESTADO DE MEXICO, C.P. 54719', 'CUAUTITLAN IZCALLI', 'ESTADO DE MEXICO', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR A TEPO LA AURORA KM1 SN No. 0, AXOTLAN, CUAUTITLAN IZCALLI, ESTADO DE MEXICO, C.P. 54719', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-071-2026 — ROBEREST S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-071-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-071-2026', 71, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-071-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '9356b815-ea92-469b-8dda-55436c7f210a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-071-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'f9f90762-483e-46e7-8754-71dbc6fba2a5', 10.24, 'HIDALGO #125A TEPATITLAN DE MORELOS, JALISCO COL. CENTRO C.P. 47600', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-01-09', '2026-01-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HIDALGO #125A TEPATITLAN DE MORELOS, JALISCO COL. CENTRO C.P. 47600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-054-2026 — GRUPO EMPRESARIAL CAYPE SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-054-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-054-2026', 54, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-054-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'e15d66c8-91e2-4cb2-bd1f-459e10a9172a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-054-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '9f6c00e4-1db5-4a0c-8263-58758055baa4', 59.4, 'HERON RAMIREZ No 1490, RODRIGUEZ, C.P. 88630 Reynosa Tamaulipas', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HERON RAMIREZ No 1490, RODRIGUEZ, C.P. 88630 Reynosa Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-073-2026 — RAUL ARMANDO JARAMILLO LEAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-073-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-073-2026', 73, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-073-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '5c36368d-87c6-44d7-8219-487a2a449219';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-073-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '18e87ede-8292-4339-a97b-2f33dc6bf764', 16.9, 'AV JOSE SULAIMAN CHAGNON No 2048, MORELOS, C.P. 87050 Victoria Tamaulipas', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV JOSE SULAIMAN CHAGNON No 2048, MORELOS, C.P. 87050 Victoria Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-072-2026 — EL ANCLADERO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-072-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-072-2026', 72, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-072-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '573143af-b3f8-4685-827f-0a7332d3a0e1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-072-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'e7ff319a-06d4-4b60-a1e6-e12235af4575', 38.4, 'AV. JOSE GONZALEZ CARNICERITO #744 TEPATITLAN DE MORELOS, JALISCO COL. FRACC LA GLORIA C.P. 47670', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. JOSE GONZALEZ CARNICERITO #744 TEPATITLAN DE MORELOS, JALISCO COL. FRACC LA GLORIA C.P. 47670', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-031-2026 — JOSE GUADALUPE LOZANO GARCIA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-031-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-031-2026', 31, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-031-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'a696ce75-bd92-46f5-9c9b-ae8f4b257e89';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-031-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'f3b67e6e-b9b0-4547-bdf2-8ffeb23fafa0', 20, 'MORELOS, S/N, CP. 34760, PEÑON BLANCO CENTRO', 'PEÑON BLANCO', 'DURANGO', 'cerrado', '2026-01-17', '2026-01-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MORELOS, S/N, CP. 34760, PEÑON BLANCO CENTRO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-090-2026 — SERV CONTR DE PER SECOPE SC
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-090-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-090-2026', 90, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-090-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '58e1a56d-7592-4b31-a0b5-ec46f26a92e8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-090-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'd9ce20ce-16af-488b-b7d3-b588e24edcb3', 30, 'ARGENTINA 303 , PANAMERICANA, Chihuahua, Chihuahua, C.P. 31210', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-21', '2026-01-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ARGENTINA 303 , PANAMERICANA, Chihuahua, Chihuahua, C.P. 31210', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-116-2026 — SERVICIOS ADMINISTRATIVOS TRANSFORMANDO LA ED
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-116-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-116-2026', 116, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-116-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '3a48150c-065b-4e1a-b7f6-63b30f8b9751';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-116-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'cbff6f1c-4a7f-431f-98ee-dc9f0d4f8e40', 64.57, 'AV. BICENTENARIO No. LT 1B-2, COLONIA SALITRILLO, HUEHUETOCA, MEXICO, CP. 54685', 'HUEHUETOCA', 'MEXICO', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. BICENTENARIO No. LT 1B-2, COLONIA SALITRILLO, HUEHUETOCA, MEXICO, CP. 54685', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1414-2025 — NANCY CANTU BENAVIDES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1414-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1414-2025', 11414, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1414-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '5586942e-6a27-4b37-b79d-76ab5828477c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1414-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'e98e27a1-5f7b-49d3-8415-c911e9c33525', 15.99, 'ROSA No 700, LOS COLORINES, C.P. 66270 San Pedro Garza García Nuevo León', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ROSA No 700, LOS COLORINES, C.P. 66270 San Pedro Garza García Nuevo León', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-019-2026 — BUD BLOOM SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-019-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-019-2026', 19, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-019-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '4c964335-3729-4d94-af97-f4142369ba26';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-019-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '4da549f1-6982-48ef-89c6-f86a664165eb', 30, 'C MEZQUITE No 122, INDUSTRIAL, C.P. 20350, SAN FRANCISCO DE LOS ROMO, AGUASCALIENTES.', 'SAN FRANCISCO DE LOS ROMO', 'AGUASCALIENTES', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C MEZQUITE No 122, INDUSTRIAL, C.P. 20350, SAN FRANCISCO DE LOS ROMO, AGUASCALIENTES.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-040-2026 — PRODUCTORES Y AVICULTORES DE LA BOQUILLA DE T
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-040-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-040-2026', 40, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-040-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '55ed650d-8fe0-45c2-a568-8bf4c7a1aae4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-040-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a624973e-1af2-468b-a116-84d16c04fcdc', 120, 'DOM CON LA LOMA, S/N, CP. 35190, LA LOMA POB', 'LERDO', 'DURANGO', 'cerrado', '2026-01-17', '2026-01-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DOM CON LA LOMA, S/N, CP. 35190, LA LOMA POB', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-079-2026 — ROBERTO ABRAHAM TAFICH SANTOS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-079-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-079-2026', 79, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-079-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'eda730a2-ea89-4cdb-8c40-953fbec10666';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-079-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '7bec732a-dcf8-4f03-9ff4-ff998ea2ee7a', 12.8, 'PEDRO VALDIVIA No 1536, MIRASIERRA, C.P. 66240 San Pedro Garza Garcia Nuevo Leon', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PEDRO VALDIVIA No 1536, MIRASIERRA, C.P. 66240 San Pedro Garza Garcia Nuevo Leon', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-103-2026 — ANTONIO PRISCILIANO GONZALEZ DUEÑES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-103-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-103-2026', 103, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-103-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'b18480f8-117d-4524-af03-deda2118ce18';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-103-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '4be31702-b9cc-4848-8f17-b070494e2ab0', 15, 'CARRETERA TORREON LA PARTIDA, S/N, CP. 27412,  FRACC. RINCÓN DEL MARQUÉS', 'TORREON', 'COAHUILA', 'cerrado', '2026-01-22', '2026-01-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA TORREON LA PARTIDA, S/N, CP. 27412,  FRACC. RINCÓN DEL MARQUÉS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-104-2026 — CLARA LORENA VALDEZ GONZALEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-104-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-104-2026', 104, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-104-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '00f0be8a-1a49-4799-bd14-d2310a7e1681';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-104-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2d360e66-b60b-4eb6-8548-fafe57b24772', 30, 'ZARAGOZA No. 177, CP. 27800, SAN PEDRO DE LAS COL', 'SAN PEDRO', 'COAHUILA', 'cerrado', '2026-01-22', '2026-01-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ZARAGOZA No. 177, CP. 27800, SAN PEDRO DE LAS COL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-089-2026 — SOCIEDAD INMOBILIARIA MEDICA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-089-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-089-2026', 89, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-089-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'b7d6adb9-00be-40df-a2fb-f74fcf6b7d38';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-089-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '4b5b6b8b-516d-48fe-8b7c-1f124a130f62', 480, 'TOMAS VALLES VIVAR 6500 , VISTAS DEL SOL, Chihuahua, Chihuahua, C.P. 31206', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-21', '2026-01-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'TOMAS VALLES VIVAR 6500 , VISTAS DEL SOL, Chihuahua, Chihuahua, C.P. 31206', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1426-2025 — ENRIQUE GARCIA VILLARREAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1426-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1426-2025', 11426, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1426-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'ecff1720-c1bb-413a-b9e1-3e17ccbd90e7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1426-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '5d81fceb-56d0-4ff9-8db4-f148cc38218d', 18.6, 'CAM A RANCHO D TIO TORRES SN, CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2025-12-12', '2025-12-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAM A RANCHO D TIO TORRES SN, CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-091-2026 — SOC INMOB MEDICA DE MEX SA CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-091-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-091-2026', 91, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-091-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'cbe477db-aee2-4638-b7ef-8d500fab0d11';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-091-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '86bfb274-6c2d-4dcf-bf9a-2799be351300', 240, 'HDAS DEL VALLE 7120 392722, CUMBRES RESIDENCIAL, Chihuahua, Chihuahua, C.P. 31216', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-22', '2026-01-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HDAS DEL VALLE 7120 392722, CUMBRES RESIDENCIAL, Chihuahua, Chihuahua, C.P. 31216', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1427-2025 — BENJAMIN GARCIA VILLARREAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1427-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1427-2025', 11427, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1427-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '2a00cd1a-1ff5-420d-a06d-d613b13c0a03';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1427-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'b999e744-1675-496b-8bba-298de9ef74cb', 18.6, 'CAMINO AL RANCHO TIO TORRES NO. 23 LA CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2025-12-12', '2025-12-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO AL RANCHO TIO TORRES NO. 23 LA CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-078-2026 — EUGENIO ALEJANDRO GONZALEZ PEÑA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-078-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-078-2026', 78, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-078-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '851e3b1c-4b82-4eac-8d32-9d662c08db35';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-078-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '8f633351-b8d2-4a34-822a-94890d965ac0', 36.3, 'ROMA No 60 Int 222, OLIMPICO, C.P. 66240 San Pedro Garza Garcia Nuevo Leon', 'SAN PEDRO GARZA GARCIA', 'NUEVO LEON', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ROMA No 60 Int 222, OLIMPICO, C.P. 66240 San Pedro Garza Garcia Nuevo Leon', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-022-2026 — MOTEL LA CIMA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-022-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-022-2026', 22, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-022-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '1a5caf90-924f-4403-9151-a747f7b4401d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-022-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '082d1362-f408-4a23-a1e7-e3ba1730e3cc', 100, 'RAMON RAYON 1520 , WATERFILL RIO BRAVO, Juárez, Chihuahua, C.P. 32553', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RAMON RAYON 1520 , WATERFILL RIO BRAVO, Juárez, Chihuahua, C.P. 32553', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-032-2026 — JOSE LUIS REYES ORTIZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-032-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-032-2026', 32, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-032-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'ff984db0-b30c-43b7-8854-4193f7febf28';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-032-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'baae6669-fc81-4c88-a7db-41c2258df661', 6, 'LIBRAMIENTO SAN IGNACIO No. 6001, CP. 34208, FRACC. VILLA BLANCA', 'DURANGO', 'DURANGO', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LIBRAMIENTO SAN IGNACIO No. 6001, CP. 34208, FRACC. VILLA BLANCA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-034-2026 — DANIEL FRANCO CASILLAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-034-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-034-2026', 34, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-034-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '8a45186b-9332-4a4c-8cfa-c1fa7d657fb7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-034-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '5abf776e-5965-4b9c-baee-11d5f6c42fbc', 14.88, 'J LUIS VELAZCO #262 A COL. CENTRO, TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'J LUIS VELAZCO #262 A COL. CENTRO, TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-117-2026 — COPPEL S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-117-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-117-2026', 117, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-117-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'ae11fa46-27de-4116-a79d-881bceb278eb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-117-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '557b0004-9648-40c7-b483-ca55e7e02621', 60, '58 x 59 y 61 No. 490, CENTRO, MERIDA, YUCATAN, CP. 97000', 'MERIDA', 'YUCATAN', 'cerrado', '2026-01-26', '2026-01-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-26T09:00:00-07:00'::TIMESTAMPTZ, 180, '58 x 59 y 61 No. 490, CENTRO, MERIDA, YUCATAN, CP. 97000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1367-2025 — ALBERTO MARQUEZ MARTINEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1367-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1367-2025', 11367, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1367-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '3c993e4c-b29a-407f-a066-00706763c628';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1367-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '89849b6a-6ae1-449d-8ffc-b531f7bb3dbb', 51.66, 'BODEGA 52 UNIDAD 2 ZONA A, COL. PALMA SOLA C.P. 933320, MUNICIPIO DE POZA RICA HIDALGO, VER', 'POZA RICA DE HIDALGO', 'VERACRUZ', 'cerrado', '2025-11-25', '2025-11-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2025-11-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BODEGA 52 UNIDAD 2 ZONA A, COL. PALMA SOLA C.P. 933320, MUNICIPIO DE POZA RICA HIDALGO, VER', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-023-2026 — ABARROTERA SUPER CAMARGO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-023-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-023-2026', 23, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-023-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '8f5f0c5b-d998-4fd8-83ad-d3f75a272f98';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-023-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '6c53d8cf-8a36-4375-9022-0abd97986047', 26, 'MONTES DE OCA 0408 , CIUDAD CAMARGO CENTRO, Camargo, Chihuahua, C.P. 33700', 'CAMARGO', 'CHIHUAHUA', 'cerrado', '2026-01-23', '2026-01-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MONTES DE OCA 0408 , CIUDAD CAMARGO CENTRO, Camargo, Chihuahua, C.P. 33700', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-047-2026 — AUTOSERVICIO ROSALES SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-047-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-047-2026', 47, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-047-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '37d47efc-2388-4d0f-a699-978b2b87cdb2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-047-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'e0797a46-9cde-4fad-86a9-2fd59eddb375', 20, 'BLVD. PASEO RIO SONORA No.422, COLONIA FUENTES DEL MEZQUITAL, HERMOSILLO, SONORA, CP. 83240', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-06', '2026-01-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. PASEO RIO SONORA No.422, COLONIA FUENTES DEL MEZQUITAL, HERMOSILLO, SONORA, CP. 83240', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-060-2026 — ERGIO ROMEO GONZALEZ DE LA PEÑA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-060-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-060-2026', 60, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-060-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'fd5fe5c1-99fa-4e11-b62b-0f429f0e8e3f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-060-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2e8e1b9c-95d5-4156-b3a0-43998a486245', 18.1, 'RANCHO EL MONILO SN, BELLA UNION 25355 ARTEAGA COAHUILA DE ZARAGOZA', 'ARTEAGA', 'NUEVO LEON', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RANCHO EL MONILO SN, BELLA UNION 25355 ARTEAGA COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-094-2026 — AMEZOLA GUZMAN CRISTIAN
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-094-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-094-2026', 94, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-094-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '450ecfe7-4f62-483b-b443-454dd7f4cfa2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-094-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '2de1f6eb-b0a6-44ec-bd63-f3b9ac3456d8', 6.57, 'EMILIANO ZAPATA #131 COL. LA CEJA, ZAPOTLANEJO JALISCO C.P. 45430', 'ZAPOTLANEJO', 'JALISCO', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'EMILIANO ZAPATA #131 COL. LA CEJA, ZAPOTLANEJO JALISCO C.P. 45430', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-106-2026 — GRUPO OPERADOR DE SERVICIOS INTEGRADOS SIG SA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-106-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-106-2026', 106, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-106-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '388ea140-db48-411b-9ae3-f94520b4d07a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-106-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'f3b7940f-2dd1-4a42-b0e0-6ebd14987e4c', 25.27, 'BLVD . DURANGO No. 111, CP. 34140, COL. DIVISION DEL NORTE', 'DURANGO', 'DURANGO', 'cerrado', '2026-01-24', '2026-01-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD . DURANGO No. 111, CP. 34140, COL. DIVISION DEL NORTE', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-115-2026 — HELENA MARTENS NEUFELD
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-115-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-115-2026', 115, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-115-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '19212460-134d-4138-9fef-068a9249a072';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-115-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'de200679-10fa-4dfb-9a41-0fbb6014b243', 50, 'BLVD. JORGE CASTILLO S/N L104, LAS HUERTAS FCTO, Cuauhtémoc, Chihuahua, C.P. 31555', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-01-27', '2026-01-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. JORGE CASTILLO S/N L104, LAS HUERTAS FCTO, Cuauhtémoc, Chihuahua, C.P. 31555', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1428-2025 — ANDRES GARCIA VILLARREAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1428-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1428-2025', 11428, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1428-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'e3298ecb-95f7-4eda-ac00-129d295b002c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1428-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'a2abba01-9bc1-45c6-ac24-cab3aba56e22', 18.6, 'CAMINO AL TIO TORRES NO. 119 LA CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2025-12-12', '2025-12-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-12-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO AL TIO TORRES NO. 119 LA CIENEGUILLA 67308 SANTIAGO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-085-2026 — G.M. SUPERMERCADO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-085-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-085-2026', 85, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-085-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'd3e64c03-0260-4efa-961e-f59456af576d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-085-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'f17bf2a1-d706-4f67-95aa-1bc0d9fa82a0', 51.24, 'C 24 Y 25 AVE 33 No.322 Int.D, COLONIA NUEVO PROGRESO APS, AGUA PRIETA, SONORA, CP. 84279', 'AGUA PRIETA', 'SONORA', 'cerrado', '2026-01-10', '2026-01-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C 24 Y 25 AVE 33 No.322 Int.D, COLONIA NUEVO PROGRESO APS, AGUA PRIETA, SONORA, CP. 84279', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-124-2026 — COLEGIO INGENIEROS CIVILES DE SONORA AC
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-124-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-124-2026', 124, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-124-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '921aa403-2142-4753-bcef-d7bcd02a6043';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-124-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '453a06a6-0eec-41b7-976e-c13b6f214192', 7.32, 'LUIS ROBLES LINARES UGALDE No.24, COLONIA LA VERBENA, HERMOSILLO, SONORA, CP. 83288', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LUIS ROBLES LINARES UGALDE No.24, COLONIA LA VERBENA, HERMOSILLO, SONORA, CP. 83288', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-125-2026 — JOSE CARLOS SERRATO CASTELL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-125-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-125-2026', 125, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-125-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e0b65866-260e-46c6-a4f7-4485799b1ad6';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-125-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '66df89bc-0cd7-4d44-95e9-6b6eb00cf422', 9.84, 'DEL TUCAN No.37, COLONIA LAGO ESCONDIDO, HERMOSILLO, SONORA, CP. 83245', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-12', '2026-01-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DEL TUCAN No.37, COLONIA LAGO ESCONDIDO, HERMOSILLO, SONORA, CP. 83245', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-086-2026 — MARIA DEL CARMEN RUBIO PINO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-086-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-086-2026', 86, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-086-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '0ba55410-b18b-4390-a602-715d8669abab';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-086-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '02775f72-c3ba-4a3f-9163-d8205df7581e', 6.05, 'CALLE QUINTA EMILIA No.65, COLONIA QUINTA EMILIA, HERMOSILLO, SONORA, CP. 83214', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE QUINTA EMILIA No.65, COLONIA QUINTA EMILIA, HERMOSILLO, SONORA, CP. 83214', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-118-2026 — FEDERICO RAMIREZ MELO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-118-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-118-2026', 118, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-118-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'fb7b0096-4a46-4644-94be-86609c191c1a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-118-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'fb6a3c33-1f4e-4f92-9fc9-94d24cd1c740', 20.64, 'LAZARO CARDENAS #1200, CP. 26272, EVARISTO PEREZ ARREOLA', 'ACUÑA', 'COAHUILA', 'cerrado', '2026-01-27', '2026-01-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LAZARO CARDENAS #1200, CP. 26272, EVARISTO PEREZ ARREOLA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-036-2026 — SERGIO ARMANDO GONZALEZ CERDA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-036-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-036-2026', 36, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-036-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '10df9e99-6339-43f1-a9f3-fa845f0395ed';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-036-2026', '5c207af9-2054-457f-893e-5e16427aae52', '59cb7a0b-897c-4b05-842d-be03b40ad32b', 17, 'SANTA GERTRUDIS No. 3802, MADERO, NUEVO LAREDO, TAMAULIPAS, C.P. 88270', 'NUEVO LAREDO', 'TAMAULIPAS', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'SANTA GERTRUDIS No. 3802, MADERO, NUEVO LAREDO, TAMAULIPAS, C.P. 88270', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-037-2026 — ELOY ENRIQUEZ HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-037-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-037-2026', 37, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-037-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '0f8fba9e-1131-44a8-ac0e-3ec5ca6d46db';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-037-2026', '5c207af9-2054-457f-893e-5e16427aae52', '0fa21631-b4f3-41d1-b039-3b7e490fa7a9', 15, 'PLUTARCO ELIAS CALLES No. 700 Int A, CENTRO DIAZ ORDAZ, GUSTAVO DIAZ ORDAZ, TAMAULIPAS, C.P. 88400', 'GUSTAVO DIAZ ORDAZ', 'TAMAULIPAS', 'cerrado', '2026-01-26', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PLUTARCO ELIAS CALLES No. 700 Int A, CENTRO DIAZ ORDAZ, GUSTAVO DIAZ ORDAZ, TAMAULIPAS, C.P. 88400', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-062-2026 — FLORESTHELA DAVILA PLATAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-062-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-062-2026', 62, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-062-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'ab3dd8a8-32ad-43e2-9232-f6e530982dc8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-062-2026', '5c207af9-2054-457f-893e-5e16427aae52', '1a7b7ffd-e007-4a7f-90c9-df31511a6e52', 44.7, 'CHILE No. 96, JACINTO LOPEZ, REYNOSA, TAMAULIPAS, C.P. 88756', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CHILE No. 96, JACINTO LOPEZ, REYNOSA, TAMAULIPAS, C.P. 88756', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-063-2026 — CARVIROSA INDUSTRIAL S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-063-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-063-2026', 63, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-063-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '9855ec51-c2b7-45dd-ae71-59bf61e18091';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-063-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'e28ee7e1-af2c-402c-b645-eccc13a3c7e9', 100, 'CONSTITUCION No. 204, BUENAVISTA, ALLENDE, NUEVO LEON, C.P. 67350', 'ALLENDE', 'NUEVO LEON', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CONSTITUCION No. 204, BUENAVISTA, ALLENDE, NUEVO LEON, C.P. 67350', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-015-2026 — SERGIO MUÑOZ GRIJALVA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-015-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-015-2026', 15, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-015-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'a18f18c4-ad6b-49e1-9469-dab1f7d9c2c8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-015-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'c1f50423-8622-47ac-bc81-c4729eb7843c', 28.57, 'AVE. 06 OTE 0205 , SECTOR ORIENTE, Delicias, Chihuahua, C.P. 33000', 'DELICIAS', 'CHIHUAHUA', 'cerrado', '2026-01-28', '2026-01-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE. 06 OTE 0205 , SECTOR ORIENTE, Delicias, Chihuahua, C.P. 33000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-097-2026 — UACH TECNO PARQUE 1
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-097-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-097-2026', 97, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-097-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '20892d5d-9611-4f8a-a03f-a4fddb236adf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-097-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '0d36a2ad-d9ce-425f-a912-82a0843df926', 20, 'CIRCUITO UNIVERSITARIO NVO CAM S/N , CAMPO BELLO FRACC, Chihuahua, Chihuahua, C.P. 31124', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-29', '2026-01-29', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-29T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CIRCUITO UNIVERSITARIO NVO CAM S/N , CAMPO BELLO FRACC, Chihuahua, Chihuahua, C.P. 31124', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-137-2026 — FRUTAS PERLA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-137-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-137-2026', 137, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-137-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '6b5038a0-efa8-4185-ae89-d598cf2a0564';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-137-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'a6f9d352-ab95-49cb-b47a-8b763b125444', 25.42, 'CARR APATZINGAN 4 CAMINOS No. S/N, COLONIA PIEDRA PARADA, PARACUARO, MICHOACAN, CP. 60760', 'PARACUARO', 'MICHOACAN', 'cerrado', '2026-01-11', '2026-01-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR APATZINGAN 4 CAMINOS No. S/N, COLONIA PIEDRA PARADA, PARACUARO, MICHOACAN, CP. 60760', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-126-2026 — KBY INDUSTRIALS RL CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-126-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-126-2026', 126, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-126-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'aca767dd-c94c-4a7c-aafd-f63b1f45c4c7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-126-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '1b1ea238-3bcd-4a57-9d06-f09e52159b9e', 450, 'AV ASIA 603, PARQUE INDUSTRIAL LOGISTIK II, VILLA DE REYES, SAN LUIS POTOSI , CP. 79526', 'VILLA DE REYES', 'SAN LUIS POTOSI', 'cerrado', '2026-01-29', '2026-01-29', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-29T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV ASIA 603, PARQUE INDUSTRIAL LOGISTIK II, VILLA DE REYES, SAN LUIS POTOSI , CP. 79526', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-077-2026 — AZTECA CONFITERIA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-077-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-077-2026', 77, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-077-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '00a43bdd-b727-4e17-8a13-30da1c53cf39';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-077-2026', '5c207af9-2054-457f-893e-5e16427aae52', '22443284-fa76-46d7-a77d-f58776e02a2b', 499.69, 'CARRETERA AL SALTO KM 4, BALCONES DE LA CALERA, TLAJOMULCO DE ZUÑIGA, JALISCO, C.P. 45679', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', 'cerrado', '2026-01-22', '2026-01-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA AL SALTO KM 4, BALCONES DE LA CALERA, TLAJOMULCO DE ZUÑIGA, JALISCO, C.P. 45679', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-098-2026 — ZIANYA DE LOS ANGELES SAENZ LEAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-098-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-098-2026', 98, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-098-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '0638faac-7273-4149-90c4-3e320816529c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-098-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'b02593f7-fe4d-4334-ab8c-272accf8314a', 17.28, 'NOGALES No 345, DEL VALLE, C.P. 88620 Reynosa Tamaulipas', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-01-21', '2026-01-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'NOGALES No 345, DEL VALLE, C.P. 88620 Reynosa Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-095-2026 — INMOBILIARIA PONTEVER S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-095-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-095-2026', 95, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-095-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'abdbc998-7875-4428-a4a4-5cf44ae316be';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-095-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4fcb9713-015f-4311-849b-0a67a6980771', 79.58, 'AV 115 MZ02 LT12 SMZ73 No. 0, PCN EJIDO SUR F, SOLIDARIDAD, QUINTANA ROO, C.P. 77712', 'SOLIDARIDAD', 'QUINTANA ROO', 'cerrado', '2026-01-24', '2026-01-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV 115 MZ02 LT12 SMZ73 No. 0, PCN EJIDO SUR F, SOLIDARIDAD, QUINTANA ROO, C.P. 77712', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-080-2026 — PETROMAX S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-080-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-080-2026', 80, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-080-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'd934941f-2c4b-44fa-8a10-ef5363874fa7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-080-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4133ea93-6f11-45d5-9698-67c0e0882102', 22.2, 'AUT MTE-REYNOSA S N FTE REST G No. 0, JARDINES DE GUADALUPE, GUADALUPE, NUEVO LEON, C.P. 67115', 'GUADALUPE', 'NUEVO LEON', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AUT MTE-REYNOSA S N FTE REST G No. 0, JARDINES DE GUADALUPE, GUADALUPE, NUEVO LEON, C.P. 67115', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-096-2026 — TRANY DISENOS Y MODA CHIHUAHUENSE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-096-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-096-2026', 96, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-096-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'a07f935e-95cc-4020-8b79-e4acf2b80e50';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-096-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '776791ce-d331-42de-a58e-0f395fb8515c', 3, 'JOSE MA IGLESIAS 6310 SA01, LOMAS VALLARTA, Chihuahua, Chihuahua, C.P. 31100', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'JOSE MA IGLESIAS 6310 SA01, LOMAS VALLARTA, Chihuahua, Chihuahua, C.P. 31100', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-142-2026 — ESTRAL ENERGY S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-142-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-142-2026', 142, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-142-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '891525a3-474d-40bb-9e6b-64d28e82bcd3';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-142-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '8faf71f9-a586-461a-afec-be2d3b26e52b', 350.24, 'CALLE A 1023, EL SALTO , EL SALTO , JALISCO , CP. 45680', 'EL SALTO', 'JALISCO', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE A 1023, EL SALTO , EL SALTO , JALISCO , CP. 45680', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-143-2026 — ESTRAL ENERGY S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-143-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-143-2026', 143, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-143-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'a69e242a-2fef-441c-a466-abf34ff25f51';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-143-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '8faf71f9-a586-461a-afec-be2d3b26e52b', 496, 'CAMINO VIEJO AL CASTILLO 94, EL CASTILLO , EL SALTO , JALISCO , CP. 45686', 'EL SALTO', 'JALISCO', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO VIEJO AL CASTILLO 94, EL CASTILLO , EL SALTO , JALISCO , CP. 45686', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-146-2026 — JUAN CARLOS PEÑA CAMPOS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-146-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-146-2026', 146, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-146-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '55469094-79e0-4315-9e3c-ebc6e534c9b0';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-146-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'a9cbe106-eda8-490c-8ec2-3897df56f112', 23.6, 'MORELOS No. 156 PTE, COLONIA LOS RAMONES, LOS RAMONES, NUEVO LEON, CP. 66800', 'LOS RAMONES', 'NUEVO LEON', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MORELOS No. 156 PTE, COLONIA LOS RAMONES, LOS RAMONES, NUEVO LEON, CP. 66800', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-102-2026 — GONZALEZ AMAYA YADIRA PATRICIA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-102-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-102-2026', 102, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-102-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '8f43a77a-b982-4e31-9bdb-c271ef01251f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-102-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '3a71de08-38e9-46a4-8457-1ea4a524eb9d', 66.56, 'BRACVO PTE 637, CENTRO TAMATAN, C.P. 87048, CD.VICTORIA, TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-01-23', '2026-01-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BRACVO PTE 637, CENTRO TAMATAN, C.P. 87048, CD.VICTORIA, TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-122-2026 — NANCY EDITH RODRIGUEZ HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-122-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-122-2026', 122, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-122-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '93b4b85e-bb22-405c-8a57-50b27248bba9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-122-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '29ab0b35-b0e2-49aa-8774-8aaa149aa74f', 15.9, 'ARTURO OLIVARES No 212, VILLA JARDIN, C.P. 87020 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ARTURO OLIVARES No 212, VILLA JARDIN, C.P. 87020 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-119-2026 — MUNICIPIO DE SOLEDAD DE DOBLADO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-119-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-119-2026', 119, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-119-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'c8c0eaaf-c96f-4f8a-b641-babe7e7b2abb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-119-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'deeb2db5-f41c-4f29-beb5-381f88e038e8', 12.76, 'POZO SALIDA A PROGRESO, S/N, CP. 94240, LOS GUAJITOS', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'POZO SALIDA A PROGRESO, S/N, CP. 94240, LOS GUAJITOS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-148-2026 — OCTAVIO MARIN DE LA ROSA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-148-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-148-2026', 148, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-148-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'b09d946e-e76f-4aa4-98bd-6ce668e69927';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-148-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '551bb842-963f-4568-82fd-51368ecf0085', 15.75, 'RANCHO BUENOS AIRES S/N, BUENOS AIRES FRACC, Tapachula, Chiapas, CP. 30786', 'Tapachula', 'Chiapas', 'cerrado', '2026-01-20', '2026-01-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RANCHO BUENOS AIRES S/N, BUENOS AIRES FRACC, Tapachula, Chiapas, CP. 30786', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-140-2026 — 7-ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-140-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-140-2026', 140, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-140-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'bef3078c-1d16-4992-b798-7bfb7edde14d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-140-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '456dc9ec-5a44-4468-bb0e-703e1470bc41', 15.21, 'MONTEVIDEO No.2755, COLONIA PROVIDENCIA 4o SECCION, GUADALAJARA, JALISCO, CP. 44639', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MONTEVIDEO No.2755, COLONIA PROVIDENCIA 4o SECCION, GUADALAJARA, JALISCO, CP. 44639', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-152-2026 — HUGO FLORES SÁNCHEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-152-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-152-2026', 152, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-152-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'c68be76c-02f7-4167-8142-c7c398728d6d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-152-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'adc8afef-1e0b-4446-bf11-5963122631ed', 100.8, 'Libramiento sur oriente km5 S/N, El Sacrificio, Tapachula, Chiapas, CP. 30870', 'Tapachula', 'Chiapas', 'cerrado', '2026-01-21', '2026-01-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Libramiento sur oriente km5 S/N, El Sacrificio, Tapachula, Chiapas, CP. 30870', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-120-2026 — MUNICIPIO DE SOLEDAD DE DOBLADO (PASO LAGARTO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-120-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-120-2026', 120, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-120-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '8a1341d9-b30c-4e92-b776-10fcee89f84f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-120-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'cda5eca5-e6c9-4ac8-af40-4985e28986d6', 17.4, 'BOMBEO AGUA POTABLE PASO LAGARTO, S/N, CP. 94248, PASO LAGARTO', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BOMBEO AGUA POTABLE PASO LAGARTO, S/N, CP. 94248, PASO LAGARTO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-121-2026 — MUNICIPIO DE SOLEDAD DE DOBLADO (PASO SOLANO)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-121-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-121-2026', 121, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-121-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'd799585b-0c7f-4d1b-a0f7-c9eb4eb27224';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-121-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'b7710ad4-f65b-4cff-a85e-9668100ecfc9', 17.4, 'BOMBEO DE AGUA POTABLE, S/N, CP. 94240, PASO SOLANO', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-02-02', '2026-02-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BOMBEO DE AGUA POTABLE, S/N, CP. 94240, PASO SOLANO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1393-2025 — OSCAR ANDRES ALDUENDA AMAYA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1393-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1393-2025', 11393, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1393-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '46020fc9-b633-4c52-8619-669f5a874c57';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1393-2025', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'ab617a62-794f-460d-8eca-ac48bdfc1004', 499, 'Fracción Lote Rustico número 3, colonia Teotlan, Valle de Santo Domingo, Baja California Sur, C.P. 23720', 'VALLE DE SANTO DOMINGO', 'BAJA CALIFORNIA SUR', 'cerrado', '2026-01-08', '2026-01-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Fracción Lote Rustico número 3, colonia Teotlan, Valle de Santo Domingo, Baja California Sur, C.P. 23720', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-108-2026 — HERNANDEZ GUTIERREZ IVAN ALONSO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-108-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-108-2026', 108, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-108-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '7dc6e22d-c502-4806-bf58-7498534c9cc7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-108-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'd5c8120f-021a-4e10-b82f-326dc2f36766', 65.72, 'LIB JALOS SAN JULIAN #88 COL. SAN MIGUEL EL ALTO, SAN MIGUEL EL ALTO JALISCO C.P. 47140', 'SAN MIGUEL EL ALTO', 'JALISCO', 'cerrado', '2026-01-17', '2026-01-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LIB JALOS SAN JULIAN #88 COL. SAN MIGUEL EL ALTO, SAN MIGUEL EL ALTO JALISCO C.P. 47140', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-156-2026 — LUIS GERARDO TOVAR ALANIS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-156-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-156-2026', 156, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-156-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '8a790cc3-ddd8-4f15-9f6a-5249548de747';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-156-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c092acab-5587-4ae3-9594-ebd3dfcba16e', 7.2, 'MARTIN CARRERA No. 418, CP. 64290, REGINA', 'MONTERREY', 'NUEVO LEÓN', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MARTIN CARRERA No. 418, CP. 64290, REGINA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-172-2026 — BENAVIDES DELGADO ALEJANDRO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-172-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-172-2026', 172, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-172-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'ce5084ef-4f95-4158-9699-3393d72178b7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-172-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '9ac42cdb-038c-4c21-9889-e7be190a540a', 86.6, 'AV DEL CORAL SUR 42 , LOS AYALA, LOS AYALA, NAYARIT, CP. 63724', 'LOS AYALA', 'NAYARIT', 'cerrado', '2026-01-31', '2026-01-31', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-31T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV DEL CORAL SUR 42 , LOS AYALA, LOS AYALA, NAYARIT, CP. 63724', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-155-2026 — JESUS SALDIVAR ARMENDARIZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-155-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-155-2026', 155, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-155-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '37289ab2-e4fc-47f5-8472-e3e341a38609';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-155-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '0e316534-b5d4-42ab-bd9c-8d3f8694b47f', 41, 'C. ALDAMA 2101 , MEOQUI, Meoqui, Chihuahua, C.P. 33130', 'MEOQUI', 'CHIHUAHUA', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. ALDAMA 2101 , MEOQUI, Meoqui, Chihuahua, C.P. 33130', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-170-2026 — 7 ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-170-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-170-2026', 170, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-170-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '5ee9c12a-91a3-44ee-927b-e09ac6ce58f1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-170-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '9352cbf9-3b43-452e-b6e8-ce7c845e0309', 18.14, 'RICARDO FLORES MAGON No 950 Int A, JARD DE GUADALUPE, GUADALAJARA, JALISCO , CP. 44300', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-02-04', '2026-02-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RICARDO FLORES MAGON No 950 Int A, JARD DE GUADALUPE, GUADALAJARA, JALISCO , CP. 44300', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-171-2026 — 7 ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-171-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-171-2026', 171, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-171-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '9f511226-5fc5-46c4-ace0-c1bd008cebf8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-171-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '9352cbf9-3b43-452e-b6e8-ce7c845e0309', 18.3, 'Av Federalistas No. 992, Real del Bosque, ZAPOPAN, JALISCO , CP. 45130', 'ZAPOPAN', 'JALISCO', 'cerrado', '2026-02-03', '2026-02-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Av Federalistas No. 992, Real del Bosque, ZAPOPAN, JALISCO , CP. 45130', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-181-2026 — CARLOS RIGOBERTO ESCOBEDO LUNA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-181-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-181-2026', 181, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-181-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e3eca79b-9836-4be4-9ca8-189dd5e60f6e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-181-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '0cb20fd8-8634-4d5d-9f0d-868a6589cb88', 8.4, 'POTRERO LA LOMA 585, EL FRESNO RUST NEXTIPAC, ZAPOPAN , JALISCO , CP. 45220', 'ZAPOPAN', 'JALISCO', 'cerrado', '2026-02-03', '2026-02-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'POTRERO LA LOMA 585, EL FRESNO RUST NEXTIPAC, ZAPOPAN , JALISCO , CP. 45220', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-128-2026 — INSTITUTO TECNOLOGICO Y DE ESTUDIOS SUPERIORE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-128-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-128-2026', 128, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-128-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'a91994a9-5c34-46c2-a2a9-99bec7dcdea1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-128-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'd3a2ebb3-ef45-4c74-a8be-73d2f4175818', 250, 'AV EUGENIO GARZA SADA 1500, JESUS MARIA ZONA CENTRO, JESUS MARIA, AGUASCALIENTES, C.P. 20920', 'JESUS MARIA', 'AGUASCALIENTES', 'cerrado', '2026-01-29', '2026-01-29', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-29T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV EUGENIO GARZA SADA 1500, JESUS MARIA ZONA CENTRO, JESUS MARIA, AGUASCALIENTES, C.P. 20920', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-188-2026 — INSTITUTO MIGUEL ANGEL DE OCCIDENTE AC
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-188-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-188-2026', 188, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-188-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '5d3da852-b37e-4ead-a6d5-dc3233fcbbdc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-188-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'f80294f5-1cd3-456e-9790-1fa5b221891e', 96.1, 'AV GUADALUPE No. 6600, COLONIA GUADALUPE INN, ZAPOPAN, JALISCO, CP. 45037', 'ZAPOPAN', 'JALISCO', 'cerrado', '2026-02-03', '2026-02-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV GUADALUPE No. 6600, COLONIA GUADALUPE INN, ZAPOPAN, JALISCO, CP. 45037', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-101-2026 — SUPER SERVICIO GUADALUPE INSURGENTES SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-101-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-101-2026', 101, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-101-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '70490ae7-2498-401e-b528-a6cfd1b8be9f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-101-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'a7be4cac-a3bd-4119-b97f-a57177160220', 27, 'KM 3 5 CARR AMOMOLULCO ATARASQ No 0 Int 0, VALLE DE LERMA, C.P. 52004 LERMA ESTADO DE MEXICO', 'LERMA', 'ESTADO DE MÉXICO', 'cerrado', '2026-01-27', '2026-01-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'KM 3 5 CARR AMOMOLULCO ATARASQ No 0 Int 0, VALLE DE LERMA, C.P. 52004 LERMA ESTADO DE MEXICO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-135-2026 — JUAN ANTONIO CURIEL CURIEL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-135-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-135-2026', 135, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-135-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'e3372b95-f528-4258-9d6c-ea658b5e7179';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-135-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'dbc03ba1-abaa-4d32-8e84-a05d00f534f0', 18.01, 'BENITO SIERRA No 0, ABASOLO, C.P. 87760 ABASOLO TAMAULIPAS', 'ABASOLO', 'TAMAULIPAS', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BENITO SIERRA No 0, ABASOLO, C.P. 87760 ABASOLO TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-043-2026 — MARIA IRENE MEDRANO GONZALEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-043-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-043-2026', 43, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-043-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '349d3963-59bc-4deb-ae50-b6ff2c8ed794';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-043-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'b2a93fb3-b066-4484-8489-fce19ee790f0', 20, 'PRIMO DE VERDAD No. 1004,  CP. 34120, VALLE DEL GUADIANA', 'DURANGO', 'DURANGO', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRIMO DE VERDAD No. 1004,  CP. 34120, VALLE DEL GUADIANA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-157-2026 — COMPAÑIA COMERCIAL CIMACO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-157-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-157-2026', 157, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-157-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '7bfa2594-22bb-4a46-9197-b4eff03fac23';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-157-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '77600db6-f7ec-40ea-a950-d9c56068a3a6', 187.5, 'C CANATLAN No. 422, CP. 35079, ZONA IND 4A ETAPA GLP', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C CANATLAN No. 422, CP. 35079, ZONA IND 4A ETAPA GLP', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-129-2026 — C FERNANDEZ Y CIA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-129-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-129-2026', 129, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-129-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '363f2dd4-e992-4373-9ab4-5eeeb5e2fa41';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-129-2026', '5c207af9-2054-457f-893e-5e16427aae52', '52493195-e21e-409f-b98c-bce2ffd74182', 116, 'FCO I MADERO No. 401 Int OTE, ZONA CENTRO TPCO T, TAMPICO, TAMAULIPAS, C.P. 89000', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FCO I MADERO No. 401 Int OTE, ZONA CENTRO TPCO T, TAMPICO, TAMAULIPAS, C.P. 89000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-194-2026 — PEDRO MALDONADO RAMOS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-194-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-194-2026', 194, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-194-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '2f9586a7-30c2-487b-9817-4cfcaaaf411c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-194-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'ff2efd61-516e-4e6c-9fd0-7038bea4a2e8', 6.2, 'CAMINO AZCATLAN RANCHO LOS HORNOS, LA CONSTANCIA, ZAPOTLAN DEL REY, JALISCO , CP. 45993', 'ZAPOTLAN DEL REY', 'JALISCO', 'cerrado', '2026-02-04', '2026-02-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO AZCATLAN RANCHO LOS HORNOS, LA CONSTANCIA, ZAPOTLAN DEL REY, JALISCO , CP. 45993', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-173-2026 — LUIS ANTONIO CONTRERAS PARTIDA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-173-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-173-2026', 173, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-173-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '49933b80-e9cc-4806-af57-e751de76e13a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-173-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'f7fc119a-8f6c-4afb-9f25-6ba0ebb1c7b1', 73.15, 'JAVIER MINA #104 COL. CONCEPCION DE BUENOS AIRES, CONCEPCION DE BUENOS AIRES, JALISCO C.P. 49170', 'CONCEPCION DE BUENOS AIRES', 'JALISCO', 'cerrado', '2026-02-06', '2026-02-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'JAVIER MINA #104 COL. CONCEPCION DE BUENOS AIRES, CONCEPCION DE BUENOS AIRES, JALISCO C.P. 49170', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-147-2026 — GOMEZ MUÑOZ DANIEL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-147-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-147-2026', 147, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-147-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '2d65c8a8-ae19-47c4-a50e-f1c7b2f2bccf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-147-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '4e7d2fdb-5173-4497-bbb6-6e0ab6c3a967', 26.66, 'PEDRO MEDINA #267 COL. CENTRO TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-02-04', '2026-02-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PEDRO MEDINA #267 COL. CENTRO TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-195-2026 — JOSE LUIS DE LA REE ABRIL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-195-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-195-2026', 195, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-195-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '7d03a70f-cf4a-41ee-bc5c-c30b8cee8281';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-195-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '52850f62-362c-4dae-a403-618bc8e8aec0', 15, 'TARASCA NO. 3 , SAN LUIS, HERMOSILLO, SONORA, CP. 83160', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'TARASCA NO. 3 , SAN LUIS, HERMOSILLO, SONORA, CP. 83160', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-168-2026 — GSF FITNESS SAPI DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-168-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-168-2026', 168, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-168-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'f1a43ff8-9cef-414c-8021-f22693b306ba';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-168-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'a0476799-3c58-49d2-83da-8d5ae6314bf4', 116.85, 'BLVD. SANCHEZ TABOADA 10713 J, AVIACION, Tijuana, Baja California, C.P. 22014', 'TIJUANA', 'BAJA CALIFORNIA', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. SANCHEZ TABOADA 10713 J, AVIACION, Tijuana, Baja California, C.P. 22014', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-185-2026 — LAS CONCHAS PESQUERAS CCO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-185-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-185-2026', 185, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-185-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'cdbf9b18-1c0d-4cb6-91b7-3b08856da103';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-185-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '65d5597d-b250-4824-9ed5-251a75baf290', 37.2, 'CALLE NARDO Y SIN NOMBRE S/N, COLONIA ARCO IRIS, HERMOSILLO, SONORA, CP. 83285', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE NARDO Y SIN NOMBRE S/N, COLONIA ARCO IRIS, HERMOSILLO, SONORA, CP. 83285', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-186-2026 — SONORA NATURALS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-186-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-186-2026', 186, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-186-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '34af4b0d-411b-4b95-913b-8a037dc8a840';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-186-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '43a5bb6b-2456-4595-944e-1b690d044002', 12.4, 'CARRETERA A LA COLORADA No.351 Int. B4, COLONIA PARQUE INDUSTRIAL, HERMOSILLO, SONORA, CP. 83299', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA A LA COLORADA No.351 Int. B4, COLONIA PARQUE INDUSTRIAL, HERMOSILLO, SONORA, CP. 83299', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-139-2026 — MAURICIO DEUTSCH AZCARRAGA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-139-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-139-2026', 139, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-139-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '449091e6-2952-4fea-9ba8-c6ed88bcf8bd';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-139-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '128bc809-692e-4ec6-88b5-ab4ac7d8a04f', 20.32, 'AVE MONTEMAYOR No 100 Int A, LA HERRADURA, C.P. 89219 TAMPICO TAMAULIPAS', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-02-04', '2026-02-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-02-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE MONTEMAYOR No 100 Int A, LA HERRADURA, C.P. 89219 TAMPICO TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-083-2026 — ASOC REG DE NINOS AUTISTAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-083-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-083-2026', 83, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-083-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'f5628874-aea0-45f6-8e1c-e9fb07570a2f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-083-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'a9072697-2223-428b-b524-ffbf7f992ae9', 9.2, 'ALAMO CERDENA No 0 Int SN, CAMPANIA, C.P. 66166 Santa Catarina Nuevo Leon', 'SANTA CATARINA', 'NUEVO LEON', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ALAMO CERDENA No 0 Int SN, CAMPANIA, C.P. 66166 Santa Catarina Nuevo Leon', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-203-2026 — JOSE LUIS VILLASEÑOR HUERTA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-203-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-203-2026', 203, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-203-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'c660bb79-4ea8-42b6-9429-9395832857f2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-203-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'ec5a886c-6534-46a1-8055-a8b323c9dd5d', 10, 'CAMINO LAGUNA EL CAPULIN S/N, COLONIA CORRAL DE PIEDRA, CASIMIRO CASTILLO, JALISCO, CP. 48930', 'CASIMIRO CASTILLO', 'JALISCO', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO LAGUNA EL CAPULIN S/N, COLONIA CORRAL DE PIEDRA, CASIMIRO CASTILLO, JALISCO, CP. 48930', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-182-2026 — MARIA EUGENIA CAMPOS GALVAN
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-182-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-182-2026', 182, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-182-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '69de220e-92a2-4345-aedc-c16f1c97bed6';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-182-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'd472c02e-fe97-4911-b4c8-7871d31a3a47', 20, 'VALLE ESCONDIDO 5501 B25, BOSQUES SAN FCO II, Chihuahua, Chihuahua, C.P. 31115', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-02-06', '2026-02-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'VALLE ESCONDIDO 5501 B25, BOSQUES SAN FCO II, Chihuahua, Chihuahua, C.P. 31115', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-153-2026 — IND GASTRONOMICA DE PARRAL SA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-153-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-153-2026', 153, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-153-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'c5549e4c-3f52-4508-8670-24ef4dd30689';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-153-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '7a5dd0f1-91dd-46f8-8653-ac74204d9a89', 90, 'PROLONG. AVE RIO FLORIDO 1001 , SECTOR ORIENTE, Delicias, Chihuahua, C.P. 33000', 'DELICIAS', 'CHIHUAHUA', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PROLONG. AVE RIO FLORIDO 1001 , SECTOR ORIENTE, Delicias, Chihuahua, C.P. 33000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-088-2026 — JOSE GUADALUPE NAVA REYNA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-088-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-088-2026', 88, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-088-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'e96b64ab-78e3-49bd-aef2-464725a3822d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-088-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '582cab0f-b845-4413-a875-53e10ba873a9', 24, '13 Y 14 OCAMPO No 453 Int 0, TAMATAN, C.P. 87048 Victoria Tamaulipas', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-01-23', '2026-01-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-23T09:00:00-07:00'::TIMESTAMPTZ, 180, '13 Y 14 OCAMPO No 453 Int 0, TAMATAN, C.P. 87048 Victoria Tamaulipas', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-134-2026 — ULTRA PURIFICADORA RUPAL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-134-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-134-2026', 134, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-134-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '44a70e2c-8ace-4f7c-8219-93e3df133c30';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-134-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '11a26f50-098c-4c03-8270-2d92692f86d0', 40.32, 'B REYES No 208 Int B. GRAL BRAVO, C.P. 67000 GENERAL BRAVO NUEVO LEON', 'GENERAL BRAVO', 'NUEVO LEON', 'cerrado', '2026-01-31', '2026-01-31', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-31T09:00:00-07:00'::TIMESTAMPTZ, 180, 'B REYES No 208 Int B. GRAL BRAVO, C.P. 67000 GENERAL BRAVO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-144-2026 — TELNEC SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-144-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-144-2026', 144, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-144-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'd7e8f354-781e-46fa-ba0b-7650675706fd';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-144-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '483e80a1-6bef-4b24-93a2-6def08de0a6e', 383.76, 'CALZADA VALLEJO, No. 8, CP. 54170, VENUSTIANO CARRANZA', 'TLALNEPANTLA DE BAZ', 'ESTADO DE MEXICO', 'cerrado', '2026-02-12', '2026-02-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALZADA VALLEJO, No. 8, CP. 54170, VENUSTIANO CARRANZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-205-2026 — ARCOS SERCAL INMOBILIARIA S. DE R.L. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-205-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-205-2026', 205, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-205-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '80b253da-f72f-469b-8712-cb45bd091afb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-205-2026', '5c207af9-2054-457f-893e-5e16427aae52', '7f108d49-d6ec-414a-ac90-8fd7938dfbe9', 120, 'SM17 M3 L No. 5, SUPERMANZANA 17 F, BENITO JUAREZ, QUINTANA ROO, C.P. 77505', 'BENITO JUAREZ', 'QUINTANA ROO', 'cerrado', '2026-02-12', '2026-02-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'SM17 M3 L No. 5, SUPERMANZANA 17 F, BENITO JUAREZ, QUINTANA ROO, C.P. 77505', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-158-2026 — GENMAR S. DE P.R. DE R.L. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-158-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-158-2026', 158, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-158-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'e1a95eaa-db81-4916-8efc-dbc0755a1ba3';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-158-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '73f9e8f0-bd8b-47e2-82ce-7d447c2f8496', 372, 'PP EL PILAR CARR GP GCI, S/N, CP. 35119,  LUJAN POB GPL', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-08', '2026-02-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PP EL PILAR CARR GP GCI, S/N, CP. 35119,  LUJAN POB GPL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-163-2026 — SERVICIO VALOR SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-163-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-163-2026', 163, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-163-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'd3914dbe-6073-4d65-8c4f-49d7a56958fa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-163-2026', '5c207af9-2054-457f-893e-5e16427aae52', '39f791f0-3836-4ed1-a52a-0cb8b23634e4', 52.2, 'LIB NACIONES UNIDAS 1002 ALTOS, NACIONES UNIDAS, CD VICTORIA, TAMAULIPAS, C.P. 87049', 'CD VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LIB NACIONES UNIDAS 1002 ALTOS, NACIONES UNIDAS, CD VICTORIA, TAMAULIPAS, C.P. 87049', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-197-2026 — GALAXY BOL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-197-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-197-2026', 197, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-197-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '85f89bc2-f40f-4ae6-93eb-6896a62ef3cd';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-197-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '854a20f3-d3f9-48ca-85dc-39f521ab0c94', 104.2, 'PERIF LEA, No. 589,CP. 25070, LOURDES ORIENTE', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PERIF LEA, No. 589,CP. 25070, LOURDES ORIENTE', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-035-2026 — GRANJA EL QUIJOTE S. DE P.R DE R.L.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-035-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-035-2026', 35, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-035-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '2dfb80cd-efec-494b-9adc-2c4a518edbb4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-035-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'd24a7889-e673-4f73-a466-1a06125508eb', 4.26, 'CAMINO A JAMAY MALTARAÑA KM 1.5 COL CENTRO, JAMAY, JALISCO C.P. 47900', 'JAMAY', 'JALISCO', 'cerrado', '2026-01-07', '2026-01-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO A JAMAY MALTARAÑA KM 1.5 COL CENTRO, JAMAY, JALISCO C.P. 47900', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-070-2026 — JORGE RODRIGUEZ JIMENEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-070-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-070-2026', 70, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-070-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '6377475d-0b72-4498-b6a3-79704901f8f9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-070-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '29d5a04e-5692-4732-9507-b8b1534a5164', 21.6, 'CAMINO A LA CANTERA #95 COL. PUEBLO VIEJO ZAPOTLANEJO, JALISCO C.P. 45427', 'ZAPOTLANEJO', 'JALISCO', 'cerrado', '2026-01-15', '2026-01-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO A LA CANTERA #95 COL. PUEBLO VIEJO ZAPOTLANEJO, JALISCO C.P. 45427', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-189-2026 — CONCESIONARIA AUTOPISTA GDL TEPIC SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-189-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-189-2026', 189, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-189-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'f1b5ea52-3615-4f58-8be1-5f1696b7a25a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-189-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '73c35afd-859d-4ed9-a6be-dad39252585b', 72, 'MACROLIBRAMIENTO GDL KM 37+900, TLAJOMULCO DE ZUÑIGA, C.P. 45665, TLAJOMULCO DE ZUÑIGA, JALISCO.', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MACROLIBRAMIENTO GDL KM 37+900, TLAJOMULCO DE ZUÑIGA, C.P. 45665, TLAJOMULCO DE ZUÑIGA, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1318-2025 — MARICELA GONZALEZ MACILLAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1318-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1318-2025', 11318, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1318-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'd2f6569e-eb89-4cab-a22a-c3f359528951';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1318-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'c0a203a1-918c-475b-b10b-bd3d96bace6a', 19.52, 'ROSA AMARILLA 129 SIERRA ALTA 64989 MONTERREY NUEVO LEON', 'MONTERREY', 'NUEVO LEON', 'cerrado', '2025-11-20', '2025-11-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-11-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ROSA AMARILLA 129 SIERRA ALTA 64989 MONTERREY NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-190-2026 — CONCESIONARIA AUTOPISTA GDL TEPIC SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-190-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-190-2026', 190, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-190-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'deb12a6e-92c4-4be8-a679-6bc8fab65fec';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-190-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '73c35afd-859d-4ed9-a6be-dad39252585b', 83, 'MACROLIBRAMIENTO SUR GDL 6 - 5, LA LAJA, C.P. 45438, ZAPOTLANEJO, JALISCO.', 'ZAPOTLANEJO', 'JALISCO', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MACROLIBRAMIENTO SUR GDL 6 - 5, LA LAJA, C.P. 45438, ZAPOTLANEJO, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-123-2026 — INDUSTRIAL VENDOR MEX SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-123-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-123-2026', 123, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-123-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '400ef915-b39c-4551-b910-c486a47fa478';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-123-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '0f55d00e-4682-4a11-830e-2bf9fe66707c', 46.13, 'CUAUHTEMOC 320, MONCLOVA CENTRO 25700, MONCLOVA COAHUILA DE ZARAGOZA', 'MONCLOVA', 'COAHUILA', 'cerrado', '2026-01-28', '2026-01-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CUAUHTEMOC 320, MONCLOVA CENTRO 25700, MONCLOVA COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-212-2026 — TRANSPORTADORA OLIGAS S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-212-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-212-2026', 212, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-212-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e27cacd1-4a0c-4a09-bf53-c4728f6c2d2c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-212-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '38c6bd56-2555-42ab-bac4-f632c11def4e', 28.8, 'AV. COLECTORA EL CORTIJO KM 1.4 S/N, COLONIA SAN JUAN DE LOS ARCOS, TALA, JALISCO, CP. 45331', 'TALA', 'JALISCO', 'cerrado', '2026-02-12', '2026-02-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. COLECTORA EL CORTIJO KM 1.4 S/N, COLONIA SAN JUAN DE LOS ARCOS, TALA, JALISCO, CP. 45331', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-234-2026 — COPIADORAS Y SERVICIOS DE SONORA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-234-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-234-2026', 234, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-234-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'd8fcfbbc-aeff-45e2-88c6-c0a6ae3a647d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-234-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'c5d26259-c1f2-4b4f-9ea4-71f6e31c5362', 66.34, 'LUIS DONALDO COLOSIO No. 286, COLONIA PRADOS DEL CENTENARIO, HERMOSILLO, SONORA, CP. 83260', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LUIS DONALDO COLOSIO No. 286, COLONIA PRADOS DEL CENTENARIO, HERMOSILLO, SONORA, CP. 83260', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-160-2026 — COMERCIALIZADORA ABC LAGUNA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-160-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-160-2026', 160, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-160-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '6b82774a-592b-4b18-96a1-7fed471f80e1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-160-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '3301e3d6-c2f0-41ba-a353-ea93a8fbc401', 74, 'BLVD. EL CERESO, S/N, CP. 35017, SOLIDARIDAD COL GLP', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. EL CERESO, S/N, CP. 35017, SOLIDARIDAD COL GLP', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-198-2026 — MA. MAYELA QUEZADA CARRILLO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-198-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-198-2026', 198, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-198-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '87c68542-5f12-4dea-afb1-435ec9071ba3';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-198-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '5aa3cdf0-21d2-4334-9f68-e20690e02ba2', 20, 'AV. AGUA NUEVA, No. 18, CP. 27845, COL. AGUA NUEVA POB', 'SAN PEDRO', 'COAHUILA', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. AGUA NUEVA, No. 18, CP. 27845, COL. AGUA NUEVA POB', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-164-2026 — MEDICINA DE ALTA ESPECIALIDAD VICTORENSE S DE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-164-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-164-2026', 164, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-164-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '01e1ac42-213e-42ed-88a1-6423ba4ac7cc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-164-2026', '5c207af9-2054-457f-893e-5e16427aae52', '8737316b-c20c-4f40-8960-3ab3d0d0e472', 36, 'BLVD FIDEL VELAZQUEZ No. 1370, FRACC LAS PALMAS, VICTORIA, TAMAULIPAS, C.P. 87050', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD FIDEL VELAZQUEZ No. 1370, FRACC LAS PALMAS, VICTORIA, TAMAULIPAS, C.P. 87050', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-165-2026 — ISELA ALEJANDRA ALFARO IZAGUIRRE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-165-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-165-2026', 165, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-165-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '1cef0dd7-4153-49f1-b089-bbd14d2915e5';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-165-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4d857786-8cb0-455f-b23d-b1f09f913f1a', 29.4, 'PRIV LA MISION No. 0 Int L 28, FRACC LAS HUERTAS, VICTORIA, TAMAULIPAS, C.P. 87025', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRIV LA MISION No. 0 Int L 28, FRACC LAS HUERTAS, VICTORIA, TAMAULIPAS, C.P. 87025', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-191-2026 — CONCESIONARIA AUTOPISTA GUADALAJARA TEPIC SA 
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-191-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-191-2026', 191, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-191-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '009004d0-5e19-4f30-be83-32f32df6eb6b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-191-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'fe648eed-a22e-4ea9-b045-1a888cc8ee07', 76, 'KM 65 DEL MACRO GDL, MIRAVALLE, C.P. 45710, ACATLAN DE JUAREZ, JALISCO.', 'ACATLAN DE JUAREZ', 'JALISCO', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'KM 65 DEL MACRO GDL, MIRAVALLE, C.P. 45710, ACATLAN DE JUAREZ, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-109-2026 — ALIMENTOS BALANCEADOS LA MEZCALERA S.P.R. DE 
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-109-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-109-2026', 109, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-109-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '7b21a708-89c9-4457-a255-e79e0bac5292';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-109-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '04273b70-5b03-4db9-a0d0-52af96864916', 56.25, 'RANCHO PALO ALTO #1 COL. LA JARA, SAN JUAN DE LOS LAGOS, JALISO C.P. 47000', 'SAN JUAN DE LOS LAGOS', 'JALISCO', 'cerrado', '2026-01-19', '2026-01-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-01-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RANCHO PALO ALTO #1 COL. LA JARA, SAN JUAN DE LOS LAGOS, JALISO C.P. 47000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-169-2026 — MALDONADO VELASCO IGNACIO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-169-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-169-2026', 169, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-169-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := 'e648cc0b-1876-46a8-a370-2f2c93c62d21';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-169-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'c9b34afd-7845-4728-8d54-549af94d76ee', 15.62, 'CAMINO A CUCHILLAS #85 COL. CUCHILLAS ZAPOTLANEJO, JALISCO C.P. 45439', 'ZAPOTLANEJO', 'JALISCO', 'cerrado', '2026-02-05', '2026-02-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO A CUCHILLAS #85 COL. CUCHILLAS ZAPOTLANEJO, JALISCO C.P. 45439', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-013-2026 — HUGO FLORES ORDOÑEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-013-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-013-2026', 13, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-013-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '616e95f8-6966-4018-8bf8-4655d81ab7aa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-013-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '39d8ee9c-c2fc-4f14-95ed-0e8682b1ed5c', 75, 'HIDALGO Y 27A 2702 , INDEPENDENCIA, Cuauhtémoc, Chihuahua, C.P. 31530', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-01-27', '2026-01-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-01-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HIDALGO Y 27A 2702 , INDEPENDENCIA, Cuauhtémoc, Chihuahua, C.P. 31530', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-218-2026 — GSF FITNESS SAPI DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-218-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-218-2026', 218, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-218-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '82adac8d-a939-4c77-83f0-541239184752';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-218-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'a0476799-3c58-49d2-83da-8d5ae6314bf4', 120, 'FCO. VILLAREAL TORRES 11301 20, PARTIDO ROMERO, Juárez, Chihuahua, C.P. 32030', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FCO. VILLAREAL TORRES 11301 20, PARTIDO ROMERO, Juárez, Chihuahua, C.P. 32030', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-227-2026 — COPPEL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-227-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-227-2026', 227, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-227-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '2eb23050-897a-4f9b-b727-359304a93246';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-227-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '76dc7b3a-16e9-4157-bf83-ef43f145732e', 40, 'BLVD ADOLFO LOPEZ MATEOS No. 2518, CENTRO MAX, C.P. 37530, LEON, GUANAJUATO.', 'LEON', 'GUANAJUATO', 'cerrado', '2026-02-17', '2026-02-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD ADOLFO LOPEZ MATEOS No. 2518, CENTRO MAX, C.P. 37530, LEON, GUANAJUATO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-210-2026 — ARQUIDIOCESIS DE HERMOSILLO AR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-210-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-210-2026', 210, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-210-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'acdaa4f5-7df6-41ba-b5b4-c4d5282e9550';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-210-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '1d0b4382-d51e-45f7-95cb-f877fff4cdef', 33.49, 'REAL DEL ARCO ESQUINA CONCORDIA S/N, COLONIA VILLA SATELITE, HERMOSILLO, SONORA, CP. 83200', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'REAL DEL ARCO ESQUINA CONCORDIA S/N, COLONIA VILLA SATELITE, HERMOSILLO, SONORA, CP. 83200', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-206-2026 — HIRMA ALICIA ROSAS MARTINEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-206-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-206-2026', 206, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-206-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '34b1b84c-c584-43d4-8c04-8552f79f7682';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-206-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'bd3bf7e1-7cdb-4b48-bc91-f32b029f6378', 24.91, 'PUERTO LOBOS No. 6, COLONIA KENNEDY, NOGALES, SONORA, CP. 84063', 'NOGALES', 'SONORA', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PUERTO LOBOS No. 6, COLONIA KENNEDY, NOGALES, SONORA, CP. 84063', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-138-2026 — LUIS EDUARDO COLLADO SOBERA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-138-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-138-2026', 138, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-138-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '316f92e1-61c5-4861-8845-a738985f054b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-138-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'e191f7e9-ef9e-4a81-b550-29e72c51adba', 23.04, 'AVENIDA B No 207, LA HERRADURA, C.P. 889219 TAMPICO TAMAULIPAS', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-02-04', '2026-02-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-02-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVENIDA B No 207, LA HERRADURA, C.P. 889219 TAMPICO TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-207-2026 — MUNICIPIO DE NOGALES SONORA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-207-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-207-2026', 207, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-207-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '4678294c-af86-43f7-9561-a66884a2d5f0';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-207-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'dfaf253b-eb01-4e1c-ad7c-2148047ad8f9', 37.2, 'AV. TECNOLOGICO S/N, COLONIA EL RASTRO, NOGALES, SONORA, CP. 84063', 'NOGALES', 'SONORA', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. TECNOLOGICO S/N, COLONIA EL RASTRO, NOGALES, SONORA, CP. 84063', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-209-2026 — CARLOS RAFAEL BEJARANO CELAYA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-209-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-209-2026', 209, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-209-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '8b6f997b-7596-4a18-b1f0-fc7a9e4422de';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-209-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'f88b780e-1ccc-4f37-bbe6-37c18d316407', 8.68, 'CJON PEDRO LIZARRAGA No.12, COLONIA EL CRUCERO, IMURIS, SONORA, CP. 84136', 'IMURIS', 'SONORA', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CJON PEDRO LIZARRAGA No.12, COLONIA EL CRUCERO, IMURIS, SONORA, CP. 84136', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-240-2026 — PROCESOS Y SUMINISTROS GV SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-240-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-240-2026', 240, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-240-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '093f4fe9-6b9d-4fd7-ae3e-e2e9dc4f9185';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-240-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '1ad9fbf0-83f8-44bd-aec7-fd1003ed3702', 59.52, 'MORENO No. 110, COLONIA LA LOMA, SANTA ANA, SONORA, CP. 84600', 'SANTA ANA', 'SONORA', 'cerrado', '2026-02-16', '2026-02-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MORENO No. 110, COLONIA LA LOMA, SANTA ANA, SONORA, CP. 84600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-241-2026 — JAVIER FRANCISCO MORENO DAVILA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-241-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-241-2026', 241, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-241-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e2bd4e61-a62b-456c-971b-12043e721b96';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-241-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '472d5a7c-2db7-48b9-87ab-8de24fcbe59d', 14.88, 'OBREGON Y CALLE 10 SUR FINAL S/N, COLONIA SANTA ANA CENTRO, SANTA ANA, SONORA, CP. 84600', 'SANTA ANA', 'SONORA', 'cerrado', '2026-02-16', '2026-02-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'OBREGON Y CALLE 10 SUR FINAL S/N, COLONIA SANTA ANA CENTRO, SANTA ANA, SONORA, CP. 84600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-248-2026 — NUEVA WAL MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-248-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-248-2026', 248, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-248-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '1fdc7158-cc1c-402c-811d-4e8ab4c8c80d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-248-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4a5a78db-eb16-4fd4-b991-d53652ed111b', 20, 'P SANTIAGO DE LA MONCLOVA No 1321, COLINAS DE SANTIAGO, Monclova, Coahuila, CP. 25790', 'Monclova', 'Coahuila', 'cerrado', '2026-02-01', '2026-02-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'P SANTIAGO DE LA MONCLOVA No 1321, COLINAS DE SANTIAGO, Monclova, Coahuila, CP. 25790', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-200-2026 — DISTRIBUIDORA SUMERCA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-200-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-200-2026', 200, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-200-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '5148f06b-6a21-447e-8017-ca52a7f8ee17';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-200-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'cd0f0766-9bd6-4f56-a914-9fed97b282f6', 59.52, 'MA CONCEPCION BARRAGAN, No. 148, CP. 66635, LA ENRAMADA REDID', 'APODACA', 'NUEVO LEÓN', 'cerrado', '2026-02-17', '2026-02-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MA CONCEPCION BARRAGAN, No. 148, CP. 66635, LA ENRAMADA REDID', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-136-2026 — PAVIMENTOS TERSA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-136-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-136-2026', 136, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-136-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'a7434b0e-a6dd-4ab5-83c1-ca322c8d0155';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-136-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '12d4c07b-3ffd-42f6-96cf-43592907ff24', 15, 'CARR VRA MTY KM 9 No 0, EJ LABORCITAS, C.P. 87235 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-01-30', '2026-01-30', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-01-30T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR VRA MTY KM 9 No 0, EJ LABORCITAS, C.P. 87235 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-235-2026 — HOSPITAL DEL COUNTRY SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-235-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-235-2026', 235, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-235-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '39a72267-d7d5-4ad2-966e-9c9d65eccec5';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-235-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '370023a9-4a1f-4a67-aef1-51d753c00acb', 297.5, 'C ALVAREZ DEL CASTILLO 1542, LOMAS DEL COUNTRY, C.P. 44610, GUADALAJARA, JALISCO.', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-02-19', '2026-02-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C ALVAREZ DEL CASTILLO 1542, LOMAS DEL COUNTRY, C.P. 44610, GUADALAJARA, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-221-2026 — INMOBILIARIA ROLAMA SC
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-221-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-221-2026', 221, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-221-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'b8f8ed8c-58e4-47bc-b23d-18e89d4725f9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-221-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'f1ba5796-7433-4a9a-afcb-e1e3c2a9f9d8', 8.68, 'AV. AMERICAS 108 13, SAN FELIPE V ETAPA, Chihuahua, Chihuahua, C.P. 31203', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. AMERICAS 108 13, SAN FELIPE V ETAPA, Chihuahua, Chihuahua, C.P. 31203', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-254-2026 — ARIEL ENCINAS GRACIA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-254-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-254-2026', 254, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-254-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '19a4ac4c-50e3-4a2a-9fb9-52132546e8a9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-254-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '306009fa-6133-4da9-851a-928b7cee6d9a', 32, 'BENJAMIN HILL No 2011, CAJEME, CAJEME,, SONORA, CP. 85050', 'CAJEME,', 'SONORA', 'cerrado', '2026-02-17', '2026-02-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BENJAMIN HILL No 2011, CAJEME, CAJEME,, SONORA, CP. 85050', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-145-2026 — LA IGLESIA DE JESUCRISTO DE LOS SANTOS DE LOS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-145-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-145-2026', 145, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-145-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '01f4fbd8-8940-49f9-ac63-8fb9a5c8da1c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-145-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'eda6b6df-d1d0-4cad-8130-322a1d384aab', 20, 'CALLE BERONA, No. 119, CP. 35018, COLONIA HAMBURGO FRACC GPL', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-08', '2026-02-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE BERONA, No. 119, CP. 35018, COLONIA HAMBURGO FRACC GPL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-166-2026 — BANCO NACIONAL DE MEXICO, S.A.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-166-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-166-2026', 166, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-166-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '325f2759-e4b3-4c1f-bd4a-c59a294b9446';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-166-2026', '5c207af9-2054-457f-893e-5e16427aae52', '5e446e32-2639-4c55-9aac-a850d0914124', 11.22, 'CENTRO SAN MARCOS, SAN MARCOS, ESTADO DE GUERRERO, C.P. 39960', 'SAN MARCOS', 'ESTADO DE GUERRERO', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CENTRO SAN MARCOS, SAN MARCOS, ESTADO DE GUERRERO, C.P. 39960', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-264-2026 — FRUTERIA SAN FRANCISCO DE HERMOSILLO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-264-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-264-2026', 264, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-264-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '434e2e03-48c9-41de-893d-74bcb892753d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-264-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '0392574f-aa0b-41d2-8814-96f7b8a6ed06', 60, 'Ave. Sierra del Sur Nº 187, SOLIDARIDAD , HERMOSILLO, SONORA, CP. 83116', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Ave. Sierra del Sur Nº 187, SOLIDARIDAD , HERMOSILLO, SONORA, CP. 83116', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-056-2026 — IRAYDA ELIBEE RODRIGUEZ CONTRERAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-056-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-056-2026', 56, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-056-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '90a75c22-7791-4c61-84e2-cdb01e9f022a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-056-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '7874a63a-1c23-4eee-9904-7a6b7a711bc2', 29.82, 'MAGNOLIA 610, ZONA MONTEBELLO 66273 SAN PEDRO GARZA GARCIA, NUEVO LEON', 'SAN PEDRO', 'NUEVO LEON', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MAGNOLIA 610, ZONA MONTEBELLO 66273 SAN PEDRO GARZA GARCIA, NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-055-2026 — MARTIN GUADALUPE LOPEZ CHAVEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-055-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-055-2026', 55, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-055-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'd6b8708f-68a3-421a-b665-3c38d181e530';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-055-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '22ec6a36-6c95-481b-93f9-f98d0005ac8a', 7.38, 'CAMINO PUBLICO 100, LA BOCA, SANTIAGO NUEVO LEON 67304', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2026-01-13', '2026-01-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMINO PUBLICO 100, LA BOCA, SANTIAGO NUEVO LEON 67304', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-154-2026 — PROMOTORA DE SEGURIDAD INDUSTRIAL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-154-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-154-2026', 154, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-154-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '6dd4e828-9618-4cc5-bffd-842035d6a090';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-154-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ffb303d0-474d-4122-b892-2565aa5fb9dd', 12, 'SANTIAGO TRONCOSO 200 4, PRADERAS DEL SUR, Juárez, Chihuahua, C.P. 32575', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-02-14', '2026-02-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'SANTIAGO TRONCOSO 200 4, PRADERAS DEL SUR, Juárez, Chihuahua, C.P. 32575', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-246-2026 — MUNICIPIO DE SOLEDAD DE DOBLADO (ESPINAL DE S
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-246-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-246-2026', 246, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-246-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '42242b2f-5896-4404-8c42-fb4328199c92';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-246-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a6aa2e38-ef30-4de7-8d75-a9b833b3045b', 27, 'BOMBEO DE AGUA POTABLE, S/N, CP. 94240, ESPINAL DE SANTA BARBARA', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-02-20', '2026-02-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BOMBEO DE AGUA POTABLE, S/N, CP. 94240, ESPINAL DE SANTA BARBARA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-247-2026 — MUNICIPIO DE SOLEDAD DE DOBLADO (TEPETATES)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-247-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-247-2026', 247, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-247-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'aa36cf96-b637-400d-a2da-2aae998d2033';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-247-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '772bc921-11dc-4bad-ad48-c8ab185d93fc', 18, 'TEPETATES Y ANGOSTURA No. 25 Z1 P1, CP. 94250, TEPETATES', 'SOLEDAD DE DOBLADO', 'VERACRUZ', 'cerrado', '2026-02-20', '2026-02-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'TEPETATES Y ANGOSTURA No. 25 Z1 P1, CP. 94250, TEPETATES', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-192-2026 — CENTRO EDUCATIVO ORALIA GUERRA DE VILLARREAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-192-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-192-2026', 192, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-192-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'bf422e56-ef3b-4ca3-b027-55d33fab2283';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-192-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '90935a18-f8a6-44ce-9ff1-9210e2bc7d0a', 70.7, 'VICENTE SUAREZ No 42, COL. ENCANTADA, H. MATAMOROS, TAM', 'MATAMOROS', 'TAMAULIPAS', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'VICENTE SUAREZ No 42, COL. ENCANTADA, H. MATAMOROS, TAM', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-167-2026 — JOSE JUAN FLORES VELA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-167-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-167-2026', 167, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-167-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'cb6dae88-12f0-4d88-a962-ba172c7aa961';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-167-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'ef75187d-cb07-4985-978e-603b506ee015', 39.68, '5 DE MAYO No. 193, SAN JOSE DEL NORTE, SANTIAGO, NUEVO LEON, C.P. 67307', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, '5 DE MAYO No. 193, SAN JOSE DEL NORTE, SANTIAGO, NUEVO LEON, C.P. 67307', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-187-2026 — HOMERO DE LA GARZA TAMEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-187-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-187-2026', 187, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-187-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'ac73ca6d-7f78-4ffd-8557-29bbd3ac245b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-187-2026', '5c207af9-2054-457f-893e-5e16427aae52', '508cab3d-9c6b-4ede-bc1e-58c842da9c8f', 15.36, 'CRISTOBAL COLON No. 4005, FRACC. RES. SAN ANGEL, VICTORIA, TAMAULIPAS, C.P. 87027', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CRISTOBAL COLON No. 4005, FRACC. RES. SAN ANGEL, VICTORIA, TAMAULIPAS, C.P. 87027', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-057-2026 — TRISTAN SALAZAR RICARDO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-057-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-057-2026', 57, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-057-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '6461e19b-1476-4c15-a22b-a6f820ff418c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-057-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '22883cbf-007f-476a-adf1-9894e8dd6bb9', 28.34, 'CARRETERA NACIONAL 200, RESIDENCIAL CAMPESTRE EL FAISAN SANTIAGO, NUEVO LEON 67302', 'SANTIAGO', 'NUEVO LEON', 'cerrado', '2026-01-17', '2026-01-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA NACIONAL 200, RESIDENCIAL CAMPESTRE EL FAISAN SANTIAGO, NUEVO LEON 67302', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-219-2026 — GSF FITNESS SAPI DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-219-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-219-2026', 219, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-219-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '202bf76c-dddb-4661-8a83-74f752fdc77b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-219-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'a0476799-3c58-49d2-83da-8d5ae6314bf4', 90, 'AV. TECNOLOGICO 2701 1, DEL MARQUEZ, Juárez, Chihuahua, C.P. 32607', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. TECNOLOGICO 2701 1, DEL MARQUEZ, Juárez, Chihuahua, C.P. 32607', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-222-2026 — OPERADORA DE FRANQUICIAS SAILE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-222-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-222-2026', 222, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-222-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '66d3e1a8-6373-4dad-ac00-996f53629940';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-222-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '3a1085d8-5ac1-4d23-b012-c7e654ce4f95', 60, 'AMERICAS 100 , SAN FELIPE V ETAPA, Chihuahua, Chihuahua, C.P. 31203', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-02-21', '2026-02-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AMERICAS 100 , SAN FELIPE V ETAPA, Chihuahua, Chihuahua, C.P. 31203', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-269-2026 — ORLANDO VALDEZ RODRIGUEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-269-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-269-2026', 269, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-269-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '96ca76c9-0fc3-485c-805a-173f7e772359';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-269-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '197ddbd6-4f64-443e-94ab-142289036bd9', 11.16, 'CALLE OCTAVA No. 202, COLONIA PALO VERDE, HERMOSILLO, SONORA, CP. 83280', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE OCTAVA No. 202, COLONIA PALO VERDE, HERMOSILLO, SONORA, CP. 83280', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-196-2026 — PROMOTORA DE HOGARES SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-196-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-196-2026', 196, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-196-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '53e71033-6f0a-496e-8402-5da640c24a7c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-196-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '948ffb29-562b-4d1c-97f6-713e76cf29f3', 32.24, 'BLVD. PASEO DE LAS RIVERAS S/N, COLONIA HIPICO RESIDENCIAL, HERMOSILLO, SONORA, CP. 83243', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. PASEO DE LAS RIVERAS S/N, COLONIA HIPICO RESIDENCIAL, HERMOSILLO, SONORA, CP. 83243', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-272-2026 — MARCO ANTONIO RUIZ HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-272-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-272-2026', 272, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-272-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '007bd2fa-04bd-4cfc-8dd9-0efdc4afdc25';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-272-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'a7be20e2-df1e-4b7c-a17e-60f8b44d14d3', 30, 'AVENIDA DIEZ NO. 232, JESUS GARCIA , HERMOSILLO, SONORA, CP. 83140', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVENIDA DIEZ NO. 232, JESUS GARCIA , HERMOSILLO, SONORA, CP. 83140', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-265-2026 — NYDIA IRLANDA GARCIA MURILLO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-265-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-265-2026', 265, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-265-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '0ed64d7e-c14e-465a-8a8e-bdcc54802a62';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-265-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '5312878a-02ba-45c5-9b09-83cabbda7527', 26, 'BLVD LUIS ENCINAS FTE DPVO, VILLAS DE MIRAMAR, HERMOSILLO, SONORA, CP. 85455', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-17', '2026-02-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD LUIS ENCINAS FTE DPVO, VILLAS DE MIRAMAR, HERMOSILLO, SONORA, CP. 85455', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-176-2026 — SONIA GRISELDA LOZANO CISNEROS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-176-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-176-2026', 176, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-176-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '9d022307-fd6e-4773-88a3-1139cb54f7bf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-176-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'b08c9f36-8ced-4a01-aa15-f910c690fa8a', 64.4, 'DR MIER 218, HIDALGO CENTRO 65600, HIDALGO NUEVO LEON', 'HIDALGO', 'NUEVO LEON', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DR MIER 218, HIDALGO CENTRO 65600, HIDALGO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-177-2026 — JESUS MARIO LOZANO CISNEROS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-177-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-177-2026', 177, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-177-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '06ee6045-892f-43a5-8b38-808984af36b7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-177-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '40da10c4-ebc5-4006-a4a2-e003e3cf71f8', 44.73, 'CUAUHTEMOC 106, HIDALGO CENTRO 65600, HIDALGO NUEVO LEON', 'HIDALGO', 'NUEVO LEON', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CUAUHTEMOC 106, HIDALGO CENTRO 65600, HIDALGO NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-217-2026 — SUPER CARNES MENI SRL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-217-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-217-2026', 217, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-217-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '8d564a22-1f53-471a-ac3b-25340b209322';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-217-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '19d10776-f266-4431-8460-bab525d2bdd4', 32, 'C. SICOMORO 701 175970 , GRANJAS, Chihuahua, Chihuahua, C.P. 31100', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. SICOMORO 701 175970 , GRANJAS, Chihuahua, Chihuahua, C.P. 31100', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-270-2026 — SERGIO CARLOS GARCIA RASCON
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-270-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-270-2026', 270, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-270-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '1920a9ca-e0f0-47c1-a16b-bd5c85d27239';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-270-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2a0cca1d-c432-49cd-9cf4-159c84b4a615', 40, 'calle 9 y 10 av. Serdán #590, CENTRO SUR, GUAYMAS, SONORA, CP. 85400', 'GUAYMAS', 'SONORA', 'cerrado', '2026-02-19', '2026-02-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'calle 9 y 10 av. Serdán #590, CENTRO SUR, GUAYMAS, SONORA, CP. 85400', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-284-2026 — AGROTATO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-284-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-284-2026', 284, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-284-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '27ff8a25-cd40-4edc-8d1a-c372fd49157a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-284-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '97f8d710-cfd5-4537-9846-85d40ed357b8', 100, 'CALLE 12 NORTE KM 20 CAMPO DON FAUSTO s/n, MIGUEL ALEMAN, HERMOSILLO, SONORA, CP. 83344', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE 12 NORTE KM 20 CAMPO DON FAUSTO s/n, MIGUEL ALEMAN, HERMOSILLO, SONORA, CP. 83344', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-159-2026 — BEPIN S.P.R. DE R.L. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-159-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-159-2026', 159, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-159-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '54d300ab-9f1c-42b0-998a-b7a31607e999';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-159-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '75abea04-ff28-4842-b139-fa8a400e7a3c', 150, 'DOMICILIO CONOCIDO EMILIO CARRANZA, S/N, POBLADO EL CAPRICHO', 'NAZAS', 'DURANGO', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DOMICILIO CONOCIDO EMILIO CARRANZA, S/N, POBLADO EL CAPRICHO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-161-2026 — ELIDA GUEL FLORES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-161-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-161-2026', 161, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-161-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '77a9ad3d-60b5-4f5e-9a96-fd86e6f266d3';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-161-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a128d67d-3d63-4fba-a8e3-0a06509e656b', 17, 'CUAHUTEMOC No. 1534, CP. 27000, COL. CENTRO', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CUAHUTEMOC No. 1534, CP. 27000, COL. CENTRO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-236-2026 — PETROMAX S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-236-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-236-2026', 236, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-236-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'fff60bef-b152-4c62-b344-5d40fcabe25c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-236-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4133ea93-6f11-45d5-9698-67c0e0882102', 34.65, 'BLVD DIAZ ORDAZ KM No. 335 Int A, LA FAMA, SANTA CATARINA, NUEVO LEON, C.P. 66100', 'SANTA CATARINA', 'NUEVO LEON', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD DIAZ ORDAZ KM No. 335 Int A, LA FAMA, SANTA CATARINA, NUEVO LEON, C.P. 66100', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-237-2026 — PETROMAX S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-237-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-237-2026', 237, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-237-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '0f8eca0c-edbf-4462-b4ca-9ffdac2c207b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-237-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4133ea93-6f11-45d5-9698-67c0e0882102', 17.82, 'BLVD DIAZ ORDAZ No. 118 Int A, LA FAMA, SANTA CATARINA, NUEVO LEON, C.P. 66100', 'SANTA CATARINA', 'NUEVO LEON', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD DIAZ ORDAZ No. 118 Int A, LA FAMA, SANTA CATARINA, NUEVO LEON, C.P. 66100', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-230-2026 — SYCIJAL SA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-230-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-230-2026', 230, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-230-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '4509fab2-e6b6-48ea-85ee-170077510ffc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-230-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'a100b9ce-d6d5-4784-9400-aaf2a571f633', 32.48, 'C SANTA ANA TEPETITLAN 449, SANTA ANA TEPETITLAN, C.P. 45230, ZAPOPAN, JALISCO.', 'ZAPOPAN', 'JALISCO', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C SANTA ANA TEPETITLAN 449, SANTA ANA TEPETITLAN, C.P. 45230, ZAPOPAN, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-287-2026 — TOMAS MATIAS ROMAN MIER
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-287-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-287-2026', 287, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-287-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '9bc6a87b-28ca-4891-9a1d-c00f05dd4b39';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-287-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '85b18d59-20d4-4136-a917-8d4411ab78e8', 12.2, 'AV. ALLENDE No. 1899, CP. 27000, COL. TERCERO DE COBIAN TRN', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-02-26', '2026-02-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. ALLENDE No. 1899, CP. 27000, COL. TERCERO DE COBIAN TRN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-220-2026 — GSF FITNESS SAPI DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-220-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-220-2026', 220, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-220-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'e47a97bc-5b9e-461f-9a09-26fa0d0c0789';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-220-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'a0476799-3c58-49d2-83da-8d5ae6314bf4', 90, 'C.MIGUEL DE LA MADRID 7908 2, LOTE BRAVO, Juárez, Chihuahua, C.P. 27000', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C.MIGUEL DE LA MADRID 7908 2, LOTE BRAVO, Juárez, Chihuahua, C.P. 27000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-201-2026 — DISTRIBUIDORA SUMERCA SA DE CV (LOS HEROES)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-201-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-201-2026', 201, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-201-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'ed80d7ea-c862-4504-aada-4ff3260a54d4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-201-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '41ebdced-8afb-430d-8d0b-ddbaf648c546', 51.46, 'AV PRINCIPAL, No. 222, CP. 66013, LOS HEROES LINCOLN', 'GARCIA', 'NUEVO LEÓN', 'cerrado', '2026-02-17', '2026-02-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV PRINCIPAL, No. 222, CP. 66013, LOS HEROES LINCOLN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-238-2026 — PETROMAX S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-238-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-238-2026', 238, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-238-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '59335bf5-40e6-4fcb-8ffa-c6e4cd94c908';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-238-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4133ea93-6f11-45d5-9698-67c0e0882102', 32.45, 'LAZARO CARDENAS No. 2475, LADERAS DEL MIRADOR, MONTERREY, NUEVO LEON, C.P. 64765', 'MONTERREY', 'NUEVO LEON', 'cerrado', '2026-02-18', '2026-02-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LAZARO CARDENAS No. 2475, LADERAS DEL MIRADOR, MONTERREY, NUEVO LEON, C.P. 64765', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-245-2026 — COPPEL S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-245-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-245-2026', 245, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-245-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '1cbab0a2-c9ab-4bad-894b-1bf7701496da';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-245-2026', '5c207af9-2054-457f-893e-5e16427aae52', '557b0004-9648-40c7-b483-ca55e7e02621', 200.75, 'CALLE 15 DE JULIO 26-A, COLONIA TROPICANA, TUXPAN, VERACRUZ, C.P. 92870', 'TUXPAN', 'VERACRUZ', 'cerrado', '2026-02-21', '2026-02-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE 15 DE JULIO 26-A, COLONIA TROPICANA, TUXPAN, VERACRUZ, C.P. 92870', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-179-2026 — RODRIGUEZ MENDOZA MARGARITA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-179-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-179-2026', 179, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-179-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '2c5aaf19-c1a5-4a20-be50-c1d80ff1e8a5';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-179-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'e9e38d9a-def6-48d5-8da7-e0839340a0de', 27.94, 'BLVD VALDES SANCHEZ NO. 13 LUIS DONALDO COLOSIO 25354 SALTILLO, COAHUILA', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD VALDES SANCHEZ NO. 13 LUIS DONALDO COLOSIO 25354 SALTILLO, COAHUILA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-267-2026 — GLIDER SALTILLO S. DE R.L. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-267-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-267-2026', 267, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-267-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '4c6b1c78-4682-4994-97b1-0d657ad75c1b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-267-2026', '5c207af9-2054-457f-893e-5e16427aae52', '02fdeb23-70ed-412c-a375-2caf3fc187ed', 98.23, 'PERIFERICO LUIS ECHEVERRIA ALVAREZ No. 1474, LOURDES ORIENTE, SALTILLO, COAHUILA, C.P. 25070', 'SALTILLO', 'COAHUILA,', 'cerrado', '2026-02-25', '2026-02-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PERIFERICO LUIS ECHEVERRIA ALVAREZ No. 1474, LOURDES ORIENTE, SALTILLO, COAHUILA, C.P. 25070', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-216-2026 — AGROFE SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-216-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-216-2026', 216, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-216-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '02a7db3e-900f-4fef-8788-efb4e3a8415b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-216-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'b7309dbc-cf99-4fca-bf99-079b43a5ef87', 8, 'LOTE 121 S/N , LA FORTUNA, Ahumada, Chihuahua, C.P. 32800', 'AHUMADA', 'CHIHUAHUA', 'cerrado', '2026-02-14', '2026-02-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LOTE 121 S/N , LA FORTUNA, Ahumada, Chihuahua, C.P. 32800', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-251-2026 — SOLORIO AVALOS RAFAEL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-251-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-251-2026', 251, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-251-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := 'ae94bba9-a428-438b-8818-ff2a72f3d0c7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-251-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '23f8c038-6f9c-4df7-8b1e-ffe53095f5c8', 22.75, 'LA COFRADIA S/N COL. CENTRO C.P. 47730 TOTOTLAN, JALISCO', 'TOTOTLAN', 'JALISCO', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LA COFRADIA S/N COL. CENTRO C.P. 47730 TOTOTLAN, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-199-2026 — MARIO ALBERTO VALDES BERLANGA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-199-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-199-2026', 199, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-199-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '20d129b1-c983-4bd0-8caa-8a795961c511';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-199-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '9b02645f-4502-4069-93ee-d4fdae6f9f11', 496, 'C.PP NUEVO LEÓN, S/N, CP. 27918, COL. NVO LEÓN POB', 'FRANCISCO I MADERO', 'COAHUILA', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C.PP NUEVO LEÓN, S/N, CP. 27918, COL. NVO LEÓN POB', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-280-2026 — BULL DENIM SA DE CV (715)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-280-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-280-2026', 280, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-280-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '24cadd2f-33b8-46e3-98d3-3a8be6da6ef6';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-280-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '5747b335-8763-4a43-b1a9-2388bd8a79c4', 60, 'AV LAZARO CARDENAS, No. 715, CP. 35000, CENTRO NORTE GÓMEZ', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-27', '2026-02-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV LAZARO CARDENAS, No. 715, CP. 35000, CENTRO NORTE GÓMEZ', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-215-2026 — VIO ROCA COMERCIAL S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-215-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-215-2026', 215, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-215-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '450aab0f-655e-4ab4-a24f-1c6a96997754';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-215-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'a251cc22-8bb3-465b-bc2e-fad1fb135f15', 157.31, 'CARRETERA FEDERAL 80 #2640 INT. 2 COL. CENTRO TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA FEDERAL 80 #2640 INT. 2 COL. CENTRO TEPATITLAN DE MORELOS, JALISCO C.P. 47600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-239-2026 — MUÑOZ REYNOSO CELINA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-239-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-239-2026', 239, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-239-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '0052e340-ff13-4e26-abb9-d0c9a50c48dc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-239-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '64512541-a6ea-4cf7-aa6f-6b1349fa92a8', 10, 'AV. HIDALGO #575 COL. CENTRO C.P. 47170 SAN JULIAN, JALISCO', 'SAN JULIAN', 'JALISCO', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. HIDALGO #575 COL. CENTRO C.P. 47170 SAN JULIAN, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-213-2026 — SARA FRANCISCA RŪIZ DIAZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-213-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-213-2026', 213, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-213-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '9d29750c-2410-40db-883d-ed69f40fdb0f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-213-2026', '5c207af9-2054-457f-893e-5e16427aae52', '721ac0d0-8a29-43ec-8e65-94430af7caf4', 14, 'ESMERALDA No. 124, FRACTO CHAIREL 33, TAMPICO, TAMAULIPAS, C.P. 89219', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-02-14', '2026-02-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ESMERALDA No. 124, FRACTO CHAIREL 33, TAMPICO, TAMAULIPAS, C.P. 89219', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-180-2026 — ANA SOFIA TORRES ZOLEZZI
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-180-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-180-2026', 180, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-180-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '58b1c7fc-0fd3-470f-bd71-7b0bf969bb63';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-180-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'e561c34e-d5ce-46df-9cd3-847a12ef2787', 14.88, 'CORDILLERA 45, RESIDENCIAL CORDILLERA 66358 SANTA CATARINA, NUEVO LEON', 'SANTA CATARINA', 'NUEVO LEON', 'cerrado', '2026-02-09', '2026-02-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CORDILLERA 45, RESIDENCIAL CORDILLERA 66358 SANTA CATARINA, NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-178-2026 — HERNANDEZ HERNANDEZ VIVIANA FA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-178-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-178-2026', 178, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-178-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '4cd7b788-1a76-41e9-a115-c0c1245580a3';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-178-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'f6c25363-7382-422f-ba68-2b9d922d7aae', 38.1, 'BLVD EMILIO A DE LA MAZA 1731 PORTAL DEL SUR 25093 SALTILLO, COAHUILA', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD EMILIO A DE LA MAZA 1731 PORTAL DEL SUR 25093 SALTILLO, COAHUILA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-258-2026 — MARIO FRANCISCO RUIZ ZAMORA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-258-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-258-2026', 258, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-258-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'a71e7561-8001-47db-9e89-9f31810c1f19';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-258-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '3f9d2130-45c1-4760-a37b-a12199861656', 21.76, 'GUAYAQUIL No 1203, 1RO DE MAYO, C.P. 89450 CIUDAD MADERO TAMAULIPAS', 'MADERO', 'TAMAULIPAS', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'GUAYAQUIL No 1203, 1RO DE MAYO, C.P. 89450 CIUDAD MADERO TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-214-2026 — JUAN RENE BASAÑEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-214-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-214-2026', 214, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-214-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'b923e990-0917-4902-a99c-1f9285c4fb14';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-214-2026', '5c207af9-2054-457f-893e-5e16427aae52', '4ba907a0-1204-42aa-8066-30eb05d503ae', 7.44, 'C. SINALOA No. 217 NTE, COL UNIDAD NACIONAL, CIUDAD MADERO, TAMAULIPAS, C.P. 89410', 'CIUDAD MADERO', 'TAMAULIPAS', 'cerrado', '2026-02-14', '2026-02-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. SINALOA No. 217 NTE, COL UNIDAD NACIONAL, CIUDAD MADERO, TAMAULIPAS, C.P. 89410', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-281-2026 — BULL DENIM SA DE CV (731)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-281-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-281-2026', 281, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-281-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '32e62e69-630f-4d51-bd1e-b6d06f320ecf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-281-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '169c0f41-29b6-49e7-b48d-57127fab963e', 60, 'CALZ L CARDENAS, No. 731. CP. 35074, ZONA IND CENTRO GPL', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-27', '2026-02-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALZ L CARDENAS, No. 731. CP. 35074, ZONA IND CENTRO GPL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-211-2026 — JENNIFER MAYTE ANDRADE DELGADO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-211-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-211-2026', 211, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-211-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '6981422b-1d7f-4ab6-9e61-e3c08717a747';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-211-2026', '5c207af9-2054-457f-893e-5e16427aae52', '3fdd3583-ec60-46e6-8bcd-7328eaa47564', 45.9, 'MONTERREY No. 225, RODRIGUEZ, REYNOSA, TAMAULIPAS, C.P. 88630', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-02-15', '2026-02-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MONTERREY No. 225, RODRIGUEZ, REYNOSA, TAMAULIPAS, C.P. 88630', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-249-2026 — TRANSERVICIOS LOGISTICOS DEL NORTE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-249-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-249-2026', 249, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-249-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '91e32890-8046-437c-b2e3-1b428b83673c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-249-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '8aea3d76-078b-4732-ac20-96913834bd3b', 200, 'LATERAL 1000, PESQUERIA NUEVO LEON 66650', 'PESQUERIA', 'NUEVO LEON', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LATERAL 1000, PESQUERIA NUEVO LEON 66650', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-184-2026 — TRANSERVICIOS LOGISTICOS DEL NORTE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-184-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-184-2026', 184, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-184-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'a11a7e58-4128-46c2-bc5a-9b1d9356d533';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-184-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '8aea3d76-078b-4732-ac20-96913834bd3b', 39.76, 'LATERAL 1006, PESQUERIA 66650, PESQUERIA NUEVO LEON', 'PESQUERIA', 'NUEVO LEON', 'cerrado', '2026-02-13', '2026-02-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LATERAL 1006, PESQUERIA 66650, PESQUERIA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-242-2026 — MUÑOZ RAMIREZ LUIS EDUARDO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-242-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-242-2026', 242, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-242-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '63ec8d22-2670-4300-bf33-8fc2f1a7e65b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-242-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '522144a4-ce47-4b35-8dda-3b01cca464e8', 12.4, 'AV. TEPEYAC #36 COL. EL TEPEYAC C.P. 47574 UNION DE SAN ANTONIO, JALISCO', 'UNION DE SAN ANTONIO', 'JALISCO', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. TEPEYAC #36 COL. EL TEPEYAC C.P. 47574 UNION DE SAN ANTONIO, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-232-2026 — COMITE DE AGUA POTABLE CAMPO 33
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-232-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-232-2026', 232, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-232-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'de9abba1-91f4-422c-98a1-65c4373ce523';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-232-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '5bd98294-ce7d-466d-bb7d-c98b83d9d9ad', 50, 'CAMPO 33 S/N , CAMPO 33, Riva Palacio, Chihuahua, C.P. 31644', 'RIVA PALACIO', 'CHIHUAHUA', 'cerrado', '2026-02-19', '2026-02-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAMPO 33 S/N , CAMPO 33, Riva Palacio, Chihuahua, C.P. 31644', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-279-2026 — GRANJA EL OLIVO SPR DE RL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-279-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-279-2026', 279, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-279-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '7d802396-67f9-49cc-80d2-ff9058ca32c1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-279-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ad427267-1ae3-46bf-bee1-d962e8880372', 97, 'CARR. GPL FCO I MADERO KM 21 S/N , EL QUEMADO, Gómez Palacio, Durango, C.P. 35118', 'GOMEZ PALACIO', 'CHIHUAHUA', 'cerrado', '2026-03-02', '2026-03-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR. GPL FCO I MADERO KM 21 S/N , EL QUEMADO, Gómez Palacio, Durango, C.P. 35118', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-309-2026 — SALVADOR REYES HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-309-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-309-2026', 309, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-309-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '6aa2b430-44c5-42c2-acd8-408d505d9438';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-309-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '9292c9aa-17a0-4793-94f2-7c86a671529a', 11.69, 'BLVD A SAN LUIS POTOSI #1501 COL. JOSE GUADALUPE PERALTA GAMEZ C.P. 20196 AGUASCALIENTES, AGUASCALIENTES', 'AGUASCALIENTES', 'AGUASCALIENTES', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD A SAN LUIS POTOSI #1501 COL. JOSE GUADALUPE PERALTA GAMEZ C.P. 20196 AGUASCALIENTES, AGUASCALIENTES', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-313-2026 — AUTO LINEAS AMERICA S.A DE C.V
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-313-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-313-2026', 313, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-313-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '3f253644-b085-47ec-8df3-f4e6233ab15d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-313-2026', '5c207af9-2054-457f-893e-5e16427aae52', '923165c1-ed92-420e-a91f-a98a6402ae63', 447, 'CARRETERA MEX II KM 8.6 S/N, CENTRO, NUEVO LAREDO , TAMAULIPAS, CP. 88000', 'NUEVO LAREDO', 'TAMAULIPAS', 'cerrado', '2026-02-26', '2026-02-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA MEX II KM 8.6 S/N, CENTRO, NUEVO LAREDO , TAMAULIPAS, CP. 88000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-229-2026 — PATRICIA AGUILAR RINCON
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-229-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-229-2026', 229, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-229-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'b60c7683-1199-4241-bd47-1c5622888103';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-229-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ef0d61d8-df55-443c-b7cb-dbe2d1bd69df', 20.4, 'C. JUAREZ 104 , MADERA CENTRO, Madera, Chihuahua, C.P. 31940', 'MADERA', 'CHIHUAHUA', 'cerrado', '2026-02-27', '2026-02-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-02-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. JUAREZ 104 , MADERA CENTRO, Madera, Chihuahua, C.P. 31940', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-310-2026 — COMERCIALIZADORA FIVICRUMA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-310-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-310-2026', 310, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-310-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '65f429ee-ba71-4d47-82f4-90972b850e8a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-310-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '5046af5a-0fce-4ab0-a457-00f28b5cd61c', 18.06, 'BLVD JESUS GARCIA MORALES No. 838, COLONIA EL LLANO, HERMOSILLO, SONORA, CP. 83210', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD JESUS GARCIA MORALES No. 838, COLONIA EL LLANO, HERMOSILLO, SONORA, CP. 83210', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-233-2026 — 7 - ELEVEN DE MEXICO S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-233-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-233-2026', 233, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-233-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '654a18c0-68cc-4456-bd8e-6c68ff6974e8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-233-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '88b67b75-9b5f-4b2f-892e-50c946b4bc78', 8.9, 'CORONEL CALDERON NO. 746, EL RETIRO , GUADALAJARA, JALISCO , CP. 44280', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CORONEL CALDERON NO. 746, EL RETIRO , GUADALAJARA, JALISCO , CP. 44280', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-278-2026 — LUIS ADRIAN CHAVEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-278-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-278-2026', 278, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-278-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '107fa2a1-c85a-42f9-bd8b-1512a5b6b94c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-278-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'c94f10c1-615d-43c1-98eb-905d13ab3cb0', 25, 'C.TIZOC 5479 , LINO VARGAS, Juárez, Chihuahua, C.P. 32600', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C.TIZOC 5479 , LINO VARGAS, Juárez, Chihuahua, C.P. 32600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-202-2026 — MERCADO CAMBERO RICHARD PAUL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-202-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-202-2026', 202, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-202-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '4bc407fc-cd77-4b54-8efa-937eb8654f8e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-202-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '8b73ef30-df63-4641-9429-46c0050673bc', 71, 'BOULEVARD TEPIC-XALISCO #57 COL. NUEVO PROGRESO XALISCO, NAYARIT C.P. 63782', 'XALISCO', 'NAYARIT', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BOULEVARD TEPIC-XALISCO #57 COL. NUEVO PROGRESO XALISCO, NAYARIT C.P. 63782', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-286-2026 — CONCESIONARIA BICENTENARIO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-286-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-286-2026', 286, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-286-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '875dd3d6-6402-4270-8be8-2d6af4d3cbff';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-286-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'bbaf2ffc-9310-4596-a7ee-24f414cf1c3d', 74.8, 'PLAZA DE COBRO LA LAJA, No. Km 0+780, CP. 38130, COLONIA TROJES', 'CELAYA', 'GUANAJUATO', 'cerrado', '2026-03-01', '2026-03-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PLAZA DE COBRO LA LAJA, No. Km 0+780, CP. 38130, COLONIA TROJES', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-288-2026 — CAU SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-288-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-288-2026', 288, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-288-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'f91ec76a-c2c4-4589-86fc-bfafbe0063ca';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-288-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '6286355f-07e7-4555-bfe7-9d96a4ea4d24', 40, 'CALLE ANTONIO DUENEZ OROZCO, S/N, CP. 27019, COLONIA ZONA INDUSTRIAL', 'TORREON', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-02-26', '2026-02-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE ANTONIO DUENEZ OROZCO, S/N, CP. 27019, COLONIA ZONA INDUSTRIAL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-069-2026 — SIGILFRIDO MILIAN FLORES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-069-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-069-2026', 69, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-069-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'a4668089-5ebd-4805-b53d-85b6af85995b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-069-2026', '5c207af9-2054-457f-893e-5e16427aae52', '09a9d60e-f089-469a-99e5-7473603f3aca', 30, 'CALLE ZARAGOZA 911, COL. CENTRO DE ALTAMIRANO, PUNGARABATO, GUERRERO, C.P. 40660', 'PUNGARABATO', 'GUERRERO', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE ZARAGOZA 911, COL. CENTRO DE ALTAMIRANO, PUNGARABATO, GUERRERO, C.P. 40660', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-111-2026 — SERGIO ANTONIO MARTINEZ LOPEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-111-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-111-2026', 111, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-111-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'e02d83d4-ae05-4f29-b0f3-8d0658d6bd81';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-111-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '56f58f63-276d-4b06-8fb1-095b4e412b92', 23.2, 'AV BRASIL 1201 INT B, CIUDAD DEPORTIVA 25750, MONCLOVA COAHUILA DE ZARAGOZA', 'MONCLOVA', 'COAHUILA', 'cerrado', '2026-01-28', '2026-01-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV BRASIL 1201 INT B, CIUDAD DEPORTIVA 25750, MONCLOVA COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-114-2026 — IRIS BELINDA FRAGA LOPEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-114-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-114-2026', 114, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-114-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '9778db74-ba20-46fd-aedf-bd11b2f6f725';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-114-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '3edf3dab-be9a-42ca-b13b-ade1fa4752b7', 35.28, 'PRIV ENCINO VERDE 2004, ESTANCIAS DE SANTA ANA 25734 MONCLOVA, COAHUILA DE ZARAGOZA', 'MONCLOVA', 'COAHUILA', 'cerrado', '2026-01-29', '2026-01-29', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-29T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRIV ENCINO VERDE 2004, ESTANCIAS DE SANTA ANA 25734 MONCLOVA, COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-326-2026 — ZEBRA PEN MANUFACTURERA SRL CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-326-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-326-2026', 326, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-326-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '873a7095-ae56-4ffb-97fc-fb12ac90d7cf';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-326-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '72afbc7a-e692-4881-b993-42a5212e3a7a', 480, 'CARRETERA MIGUEL ALEMAN KM 21 No. ED11, COLONIA CIUDAD APODACA CENTRO, APODACA, NUEVO LEON, CP. 66600', 'APODACA', 'NUEVO LEON', 'cerrado', '2026-02-20', '2026-02-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA MIGUEL ALEMAN KM 21 No. ED11, COLONIA CIUDAD APODACA CENTRO, APODACA, NUEVO LEON, CP. 66600', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-271-2026 — JAIME VILLASEÑOR DE LOZA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-271-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-271-2026', 271, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-271-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '0f954bfc-036e-488d-9c9e-e27a042086ed';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-271-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '9b000d14-a3c3-45e9-b780-7c6c2a5f99c7', 26.88, 'RANCHO LA HIEDRA S/N COL. OJO DE AGUA C.P. 47728 TEPATITLAN DE MORELOS, JALISCO', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-02-16', '2026-02-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RANCHO LA HIEDRA S/N COL. OJO DE AGUA C.P. 47728 TEPATITLAN DE MORELOS, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-005-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-005-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-005-2026', 5, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-005-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'bdb70de9-6f06-4f98-a825-b242d5a62d7c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-005-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '474967e6-123c-44c3-9284-9838f77809bc', 5, 'C. BASALTICA Y MARMOLINA S/N , BELLO HORIZONTE,
Juárez, Chihuahua, C.P. 32675', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. BASALTICA Y MARMOLINA S/N , BELLO HORIZONTE,
Juárez, Chihuahua, C.P. 32675', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-306-2026 — GAS NATURAL DEL NOROESTE SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-306-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-306-2026', 306, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-306-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '86fa12b2-710f-44c1-9bd9-8c555ebe56de';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-306-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '7dc4f886-9d16-4aff-b605-5a920c398a2a', 100, 'AV. JUAN BRITTINGHAM, No. 331, CP. 27018, COLONIA ZONA INDUSTRIAL', 'TORREON', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-03-03', '2026-03-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. JUAN BRITTINGHAM, No. 331, CP. 27018, COLONIA ZONA INDUSTRIAL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-301-2026 — AUTOMOTORES REYNOSA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-301-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-301-2026', 301, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-301-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '227c436d-347e-4ae0-b6e1-f6380a66d020';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-301-2026', '5c207af9-2054-457f-893e-5e16427aae52', '71988014-46b5-43eb-8d39-0b26688bc8cd', 120, 'CARR MONTERREY No. 106, FUENTES DEL VALLE, REYNOSA, TAMAULIPAS, C.P. 88746', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-02-28', '2026-02-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR MONTERREY No. 106, FUENTES DEL VALLE, REYNOSA, TAMAULIPAS, C.P. 88746', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-006-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-006-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-006-2026', 6, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-006-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '84642e70-3084-44a6-b1f1-7ed96c4bc0fd';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-006-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '3ece90e1-3ca6-477d-8a75-39e30abe2dd6', 5, 'C. DE LA ESPERANZA Y EMILIO TELLEZ DIAZ S/N , KM 27, Juárez, Chihuahua, C.P. 32675', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. DE LA ESPERANZA Y EMILIO TELLEZ DIAZ S/N , KM 27, Juárez, Chihuahua, C.P. 32675', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-327-2026 — ROGMAR SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-327-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-327-2026', 327, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-327-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e46bca54-4942-4ebc-967c-27c2495e1cca';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-327-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'ec5d1d1e-1587-4e66-8428-27c31ec44be1', 27.2, 'LAZARO CARDENAS No. 1223, COLONIA PARQUE INDUSTRIAL EL ALAMO, GUADALAJARA, JALISCO, CP. 44490', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LAZARO CARDENAS No. 1223, COLONIA PARQUE INDUSTRIAL EL ALAMO, GUADALAJARA, JALISCO, CP. 44490', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-316-2026 — AGROPECUARIA MARLET SA DE CV (OASIS 2)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-316-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-316-2026', 316, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-316-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '881e5731-4eb6-491e-80dd-841a1482f8e7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-316-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '675620f4-646c-4bcc-80ec-9561fef78876', 499, 'EJ SAN RAFAEL DE ARRIBA, S/N, CP. 27800, COLONIA SN RAFAEL DE ARRIBA SP', 'SAN PEDRO', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-03-06', '2026-03-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'EJ SAN RAFAEL DE ARRIBA, S/N, CP. 27800, COLONIA SN RAFAEL DE ARRIBA SP', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-320-2026 — AGROPECUARIA MARLET SA DE CV (OASIS 1)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-320-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-320-2026', 320, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-320-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'e6a6f49f-6148-4127-9bac-d75b9b8858ec';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-320-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '5d77e990-3e5b-479f-8954-e5e368b67756', 329, 'CARR LA ROSITA FINISTERRE KM 20, S/N, CP. 27800, COLONIA ROSITA SP', 'SAN PEDRO', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-03-05', '2026-03-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARR LA ROSITA FINISTERRE KM 20, S/N, CP. 27800, COLONIA ROSITA SP', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-007-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-007-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-007-2026', 7, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-007-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '31fd11b6-6308-4164-a03d-8f03b7db9903';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-007-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '474967e6-123c-44c3-9284-9838f77809bc', 5, 'C. SIERRA DE JALAPA Y EST. DEL DESIERTO S/N ,
GRANJAS DEL DESIERTO, Juárez, Chihuahua, C.P. 32675', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-05', '2026-03-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. SIERRA DE JALAPA Y EST. DEL DESIERTO S/N ,
GRANJAS DEL DESIERTO, Juárez, Chihuahua, C.P. 32675', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-305-2026 — ENSEÑANZA E INVESTIGACION SUPERIOR A.C.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-305-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-305-2026', 305, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-305-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'ea4bc037-fd64-45ac-8b66-8812841231b4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-305-2026', '5c207af9-2054-457f-893e-5e16427aae52', '46f28a6a-4f6b-44a8-820a-ca80e1db11a3', 100, 'SM10 MZ2 LT4 BONAMPAK No. 371, SUPERMANZANA 10B F, BENITO JUAREZ, QUINTANA ROO, C.P. 77503', 'BENITO JUAREZ', 'QUINTANA ROO', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'SM10 MZ2 LT4 BONAMPAK No. 371, SUPERMANZANA 10B F, BENITO JUAREZ, QUINTANA ROO, C.P. 77503', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-110-2026 — RESTAURANTES RAPIDOS DE COAHUILA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-110-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-110-2026', 110, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-110-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '99567d98-7070-41b6-bc2b-d12df812458e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-110-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'b40b6260-7e7d-44a8-9507-2fe65aa7a5fd', 114.3, 'BLVD HAROLD R PAPE 1327, EL PUEBLO, MONCLOVA COAHUILA DE ZARAGOZA 25730', 'MONCLOVA', 'COAHUILA', 'cerrado', '2026-01-28', '2026-01-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD HAROLD R PAPE 1327, EL PUEBLO, MONCLOVA COAHUILA DE ZARAGOZA 25730', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-061-2026 — ELIZABETH AVELLANEDA CHAVEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-061-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-061-2026', 61, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-061-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '09e715da-df99-41f0-9fd7-37f62f9e48f2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-061-2026', '5c207af9-2054-457f-893e-5e16427aae52', '27496cf4-9233-41f9-8b41-91a3470ffb64', 25, 'AV INOCENTE LUGO No. 109, COL LINDA VISTA ALTAMIRANO, PUNGARABATO, GUERRERO, C.P. 40660', 'PUNGARABATO', 'GUERRERO', 'cerrado', '2026-01-16', '2026-01-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-01-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV INOCENTE LUGO No. 109, COL LINDA VISTA ALTAMIRANO, PUNGARABATO, GUERRERO, C.P. 40660', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-323-2026 — KLASSEN HOLDINGS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-323-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-323-2026', 323, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-323-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '5fa834c3-4e5e-40fb-b148-e4e237e6337b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-323-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '30c06caa-b407-4029-8872-97ae6a652f19', 10, 'CORREDOR COMERCIAL 3522 , CAMPO 11, Cuauhtémoc, Chihuahua, C.P. 31613', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-03-09', '2026-03-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CORREDOR COMERCIAL 3522 , CAMPO 11, Cuauhtémoc, Chihuahua, C.P. 31613', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-328-2026 — SERVICE ZONE DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-328-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-328-2026', 328, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-328-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'ccb6353a-67e3-4d74-9367-f8f41ecc4052';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-328-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '6826acba-465a-4367-9f71-d2eb13e6fb7e', 300, 'C. H COLEGIO MILITAR 4703 A, NOMBRE DE DIOS, Chihuahua, Chihuahua, C.P. 31150', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-10', '2026-03-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. H COLEGIO MILITAR 4703 A, NOMBRE DE DIOS, Chihuahua, Chihuahua, C.P. 31150', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-307-2026 — MORINT CONSULTORA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-307-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-307-2026', 307, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-307-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '486ad808-3228-454f-a784-c74f500aef4b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-307-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '03efcf93-ec71-4227-9904-927b9b1e054c', 56, 'CALZ. JOSE VASCONCELOS, No. 1955, INT. 20, CP. 27276, HACIENDA RINCON', 'TORREÓN', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-03-03', '2026-03-03', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-03T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALZ. JOSE VASCONCELOS, No. 1955, INT. 20, CP. 27276, HACIENDA RINCON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-315-2026 — JENNIFER MAYTE ANDRADE DELGADO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-315-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-315-2026', 315, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-315-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '7345721b-5669-419d-8945-5682e3da8b8b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-315-2026', '5c207af9-2054-457f-893e-5e16427aae52', '3fdd3583-ec60-46e6-8bcd-7328eaa47564', 45.9, 'MONTERREY No. 225, RODRIGUEZ, REYNOSA, TAMAULIPAS, C.P. 88630', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-03-06', '2026-03-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MONTERREY No. 225, RODRIGUEZ, REYNOSA, TAMAULIPAS, C.P. 88630', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-317-2026 — CARLOS URIEL NOYOLA CEDILLO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-317-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-317-2026', 317, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-317-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'd747b8b6-adae-4b53-b9e9-8180d1eb7ab4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-317-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'ff589a22-62f7-44a6-a437-586168f0a72d', 20, 'CALLE PASEO DEL CAMPESTRE, No. 406, CP. 27250, COLONIA CAMPESTRE LA ROSITA', 'TORREÓN', 'COAHUILA DE ZARAGOZA', 'cerrado', '2026-03-06', '2026-03-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE PASEO DEL CAMPESTRE, No. 406, CP. 27250, COLONIA CAMPESTRE LA ROSITA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-273-2026 — SONIA LEIJA TORRES
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-273-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-273-2026', 273, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-273-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '6543e7aa-ab0b-4f1c-950f-6f0e1ba6f025';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-273-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '938ab2dc-cf3c-4964-98e0-b09cd5a19346', 207.97, 'CALLE SIN NOMBRE SN, LAS ESCOBAS 67190, GUADALUPE NUEVO LEON', 'GUADALUPE', 'NUEVO LEON', 'cerrado', '2026-02-27', '2026-02-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE SIN NOMBRE SN, LAS ESCOBAS 67190, GUADALUPE NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-193-2026 — PATRONATO PREPAPARATORIA ORALIA GUERRA DE VIL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-193-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-193-2026', 193, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-193-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '3616ccba-0088-42e4-bdd2-55cb3b0b56d8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-193-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'f58b2e95-b40c-4986-a67f-6a6fbcb99ffc', 70.7, '1a No 0, ENCANTADA, C.P. 87347 MATAMOROS TAMAULIPAS', 'MATAMOROS', 'TAMAULIPAS', 'cerrado', '2026-02-10', '2026-02-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-02-10T09:00:00-07:00'::TIMESTAMPTZ, 180, '1a No 0, ENCANTADA, C.P. 87347 MATAMOROS TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-302-2026 — ARGOTAM S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-302-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-302-2026', 302, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-302-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '2057c13c-89fc-41e1-900f-eb5ad345906f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-302-2026', '5c207af9-2054-457f-893e-5e16427aae52', '2ea7af4b-7929-46aa-8495-cf77ae8f2d3d', 48.12, 'CARRETETA RIBEREÑA KM 10, EJIDO LOS CAVAZOS, REYNOSA, TAMAULIPAS, C.P. 88614', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-02-27', '2026-02-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETETA RIBEREÑA KM 10, EJIDO LOS CAVAZOS, REYNOSA, TAMAULIPAS, C.P. 88614', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-335-2026 — FONDO AYUDA SINDICAL MUTUALISTA SECC 28 DEL S
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-335-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-335-2026', 335, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-335-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'cf45726c-6be9-4b15-9e94-bc72ebc4e1f1';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-335-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '40f3f10d-259c-47c5-8a9f-10d2ff623dec', 11.18, 'PARIS ESQ O INDICO S/N, COLONIA PRADOS DEL TEPEYAC, CAJEME, SONORA, CP. 85150', 'CAJEME', 'SONORA', 'cerrado', '2026-02-25', '2026-02-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PARIS ESQ O INDICO S/N, COLONIA PRADOS DEL TEPEYAC, CAJEME, SONORA, CP. 85150', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-333-2026 — GLORIA ZORAYA SOTO HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-333-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-333-2026', 333, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-333-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '59fa8261-e0f1-4ab0-b484-99842735880d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-333-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'c5aa7cf3-ec86-4384-9e85-791292e576db', 13.46, 'JOSE MARIA MORELOS Y PAVON No. 1619, COLONIA CAJEME, CAJEME, SONORA, CP. 85050', 'CAJEME', 'SONORA', 'cerrado', '2026-02-25', '2026-02-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'JOSE MARIA MORELOS Y PAVON No. 1619, COLONIA CAJEME, CAJEME, SONORA, CP. 85050', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-377-2026 — DISTRIBUIDORA SUMERCA SA DE CV (CANTORAL)
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-377-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-377-2026', 377, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-377-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '6c074ce1-1215-4ffc-bd61-454492b89cc0';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-377-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '68859226-e59e-4b96-a7e0-52f2ce00240b', 59.52, 'AV LUCCA No. 516, INT C, CP. 66655, CANTORAL', 'PESQUERÍA', 'NUEVO LEÓN', 'cerrado', '2026-03-09', '2026-03-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV LUCCA No. 516, INT C, CP. 66655, CANTORAL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-289-2026 — CYNTHIA VICTORIA BRAVO ORTEGA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-289-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-289-2026', 289, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-289-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '848d24b4-befb-4b6a-b492-9846dfc60e45';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-289-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a62fde09-53bb-4b23-a59e-a0d43684ebe3', 39.1, 'CALLE 20 DE NOVIEMBRE, No. 103, CP. 35000, COL. CENTRO NORTE GOMEZ', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE 20 DE NOVIEMBRE, No. 103, CP. 35000, COL. CENTRO NORTE GOMEZ', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-259-2026 — MARTHA PATRICIA MADRIGAL CORTEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-259-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-259-2026', 259, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-259-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '0336bff0-9d73-41b5-ab97-a6d2538a0aab';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-259-2026', '5c207af9-2054-457f-893e-5e16427aae52', '34431f7a-9545-41ca-9728-9022646fae5f', 16, 'WASHINGTON No. 3114 Int 0, JARDIN, NUEVO LAREDO, TAMAULIPAS, C.P. 88260', 'NUEVO LAREDO', 'TAMAULIPAS', 'cerrado', '2026-02-26', '2026-02-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'WASHINGTON No. 3114 Int 0, JARDIN, NUEVO LAREDO, TAMAULIPAS, C.P. 88260', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-008-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-008-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-008-2026', 8, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-008-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'b6162787-2f9c-4196-8a03-3458546db75e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-008-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ad9a2fec-737d-4647-b57a-dc9e4d31ebbb', 5, 'ВАTALLA DEL CERRO GRILLO Y BATALLA DEL CERRO GORDO S/N , KM 29, Juárez, Chihuahua, C.P. 32675', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-05', '2026-03-05', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-05T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ВАTALLA DEL CERRO GRILLO Y BATALLA DEL CERRO GORDO S/N , KM 29, Juárez, Chihuahua, C.P. 32675', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-133-2026 — CESAR VILLARREAL GARZA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-133-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-133-2026', 133, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-133-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '990c7cee-aed7-42a2-a021-c5439ce7e1f4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-133-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'd39a2867-b7ba-410a-90e9-48360b2fb128', 63.5, 'DEL VADO 1427, ESTANCIAS DE SAN JUAN BAUTISTA 25733, MONCLOVA, COAHUILA DE ZARAGOZA', 'MONCLOVA', 'COAHUILA', 'cerrado', '2026-01-29', '2026-01-29', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-29T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DEL VADO 1427, ESTANCIAS DE SAN JUAN BAUTISTA 25733, MONCLOVA, COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-1358-2025 — TRANSERVICIOS LOGISTICOS DEL NORTE SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1358-2025';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-1358-2025', 11358, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-1358-2025'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'f31466ae-298a-4f13-98b7-40a2d77af517';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-1358-2025', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '702bafa4-cf37-4681-895e-ca165f68b0b3', 55.38, 'LATERAL NO. 1008 PESQUERIA 66650, PESQUERIA NUEVO LEON', 'PESQUERIA', 'NUEVO LEON', 'cerrado', '2025-11-22', '2025-11-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2025-11-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LATERAL NO. 1008 PESQUERIA 66650, PESQUERIA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-243-2026 — CONFIANZA AUTORAMA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-243-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-243-2026', 243, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-243-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'edb15b01-f612-4745-bdbe-84aecb74676b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-243-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'fdd3bc2b-51e5-4589-9ae5-c694e64d58b0', 15, 'FRANCISCO I MADERO #2001 Int. 1, RIO NUEVO, ZAMORA, MICHOACAN, C.P. 59684', 'ZAMORA', 'MICHOACAN', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FRANCISCO I MADERO #2001 Int. 1, RIO NUEVO, ZAMORA, MICHOACAN, C.P. 59684', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-331-2026 — NUEVA WAL-MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-331-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-331-2026', 331, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-331-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '3c299582-b3e7-4295-997f-29603e8b871a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-331-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'cf6e9f11-a262-49fe-a880-1b80690312dc', 60, 'C. MORELOS 1181 , ASCENSION CENTRO, Ascensión, Chihuahua, C.P. 31820', 'ASCENSION', 'CHIHUAHUA', 'cerrado', '2026-03-11', '2026-03-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. MORELOS 1181 , ASCENSION CENTRO, Ascensión, Chihuahua, C.P. 31820', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-318-2026 — MARIA GUADALUPE GARCIA GUERRERO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-318-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-318-2026', 318, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-318-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '7aecce16-50bb-4a6f-94aa-bd114bb1e9ac';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-318-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a0498f25-422f-4766-95c4-82c7ce543d48', 15, 'PASEO DEL TECNOLOGICO No. 461, CP. 27285, COLONIA LA ROSITA AMPL TRN', 'TORREÓN', 'COAHUILA', 'cerrado', '2026-03-07', '2026-03-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PASEO DEL TECNOLOGICO No. 461, CP. 27285, COLONIA LA ROSITA AMPL TRN', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-244-2026 — ALEJANDRO RANDOLPH PROBERT CANSECO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-244-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-244-2026', 244, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-244-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '2823ee45-1a80-4593-9c38-365032c88be7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-244-2026', '5c207af9-2054-457f-893e-5e16427aae52', '1cce6b2e-fc06-4ba3-8e85-685f040dd9ac', 10.24, 'PRIV SANTA RITA No. 100, HACIENDA LAS CAMPAN, SAN PEDRO GARZA GARCIA,
NEUVO LEON, C.P. 66247', 'SAN PEDRO GARZA GARCIA', 'NEUVO LEON', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PRIV SANTA RITA No. 100, HACIENDA LAS CAMPAN, SAN PEDRO GARZA GARCIA,
NEUVO LEON, C.P. 66247', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-314-2026 — COPPEL SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-314-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-314-2026', 314, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-314-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'c7060f59-8e00-4002-ae8d-2dae8f1f59d5';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-314-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '76dc7b3a-16e9-4157-bf83-ef43f145732e', 22.38, 'ALHONDIGA NO. 46, COLONIA CENTRO, SAN LUIS POTOSÍ, SAN LUIS POTOSÍ, CP. 78000', 'SAN LUIS POTOSÍ', 'SAN LUIS POTOSÍ', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ALHONDIGA NO. 46, COLONIA CENTRO, SAN LUIS POTOSÍ, SAN LUIS POTOSÍ, CP. 78000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-359-2026 — IRMA SAMANIEGO HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-359-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-359-2026', 359, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-359-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'f1425523-baf7-4201-8fa7-74e70ff8c704';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-359-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '278a0f4e-a51a-46b1-88f6-66e51fae38a8', 18.6, 'MARINAO ESCOBEDO No 924 Int NTE, COLONIA CENTRO 3 MTY PTE NT, MONTERREY, NUEVO LEON, CP. 64000', 'MONTERREY', 'NUEVO LEON', 'cerrado', '2026-02-20', '2026-02-20', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-20T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MARINAO ESCOBEDO No 924 Int NTE, COLONIA CENTRO 3 MTY PTE NT, MONTERREY, NUEVO LEON, CP. 64000', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-348-2026 — FCO JAVIER RODRIGUEZ GOMEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-348-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-348-2026', 348, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-348-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'aedfa360-e908-4306-a73c-d08973a63acc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-348-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '785e9aec-ed53-40c5-a457-27de950bbe68', 30, 'CAM. A LA PRESA KM 0 No 477, EL JAGÜEY, C.P. 44249, IXTLAHUACAN DEL RIO, JALISCO.', 'IXTLAHUACAN DEL RIO', 'JALISCO', 'cerrado', '2026-03-06', '2026-03-06', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-06T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CAM. A LA PRESA KM 0 No 477, EL JAGÜEY, C.P. 44249, IXTLAHUACAN DEL RIO, JALISCO.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-334-2026 — GAXFER SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-334-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-334-2026', 334, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-334-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '08907b8a-0510-4e94-81e0-dd10d84d5583';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-334-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '1ee00e14-1ced-40d0-aa4b-3c871ee42044', 45.14, 'BLVD. LUIS ENCINAS No.652, COLONIA PETROLERA, GUAYMAS, SONORA, CP. 85456', 'GUAYMAS', 'SONORA', 'cerrado', '2026-02-25', '2026-02-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD. LUIS ENCINAS No.652, COLONIA PETROLERA, GUAYMAS, SONORA, CP. 85456', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-303-2026 — EPL DE LA FRONTERA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-303-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-303-2026', 303, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-303-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '8c353bf1-4374-499a-a77f-ca491fcaaf1a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-303-2026', '5c207af9-2054-457f-893e-5e16427aae52', '38e86faa-6909-429d-beb9-5b93a0259690', 58.88, 'CONSTITUCION No. 105, RIO BRAVO CENTRO Y, RIO BRAVO, TAMAULIPAS, C.P. 88900', 'RIO BRAVO', 'TAMAULIPAS', 'cerrado', '2026-02-28', '2026-02-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-02-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CONSTITUCION No. 105, RIO BRAVO CENTRO Y, RIO BRAVO, TAMAULIPAS, C.P. 88900', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-330-2026 — MA DE JESUS AGUIRRE SOLORIO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-330-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-330-2026', 330, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-330-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '26d4b4b0-3cc0-4e8b-a991-a366e4cedf8c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-330-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ea058f10-f922-4f65-b73d-e81db19768a1', 25, 'C. PORFIRIO DIAZ 701 , RANCHERIA JUAREZ, Chihuahua, Chihuahua, C.P. 31604', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-10', '2026-03-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. PORFIRIO DIAZ 701 , RANCHERIA JUAREZ, Chihuahua, Chihuahua, C.P. 31604', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-349-2026 — MARCELINO RAMIREZ AVILA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-349-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-349-2026', 349, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-349-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '8c26d2f4-6c03-4117-89e2-59f53b6a2ed7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-349-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '7f26cb49-72ae-4410-ba1e-5f5188e9dd11', 45, 'AV. UNIDAD 1314 , TECNOLOGICO, Delicias, Chihuahua, C.P. 33029', 'DELICIAS', 'CHIHUAHUA', 'cerrado', '2026-03-12', '2026-03-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. UNIDAD 1314 , TECNOLOGICO, Delicias, Chihuahua, C.P. 33029', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-338-2026 — E P INSUMOS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-338-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-338-2026', 338, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-338-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '5ce3ee34-6021-4f1a-b274-c412da5dba3b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-338-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'ae91506f-7b82-4b63-a7a7-903f499b9417', 20.15, 'VICENTE SUAREZ, No. 12, CP. 76224, PIE DE GALLO', 'QUERÉTARO', 'QUERÉTARO', 'cerrado', '2026-03-13', '2026-03-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'VICENTE SUAREZ, No. 12, CP. 76224, PIE DE GALLO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-266-2026 — ERNESTO GUADALUPE RODRIGUEZ TAMEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-266-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-266-2026', 266, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-266-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '5f0d1014-b87d-4b0f-8662-b89edb224771';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-266-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '45148300-f446-4303-a590-9276c6c3afa6', 8.75, 'BRECHA DE CERRO PRIETO SN ATONGO DE ABAJO 67460 CADEREYTA JIMENEZ NUEVO LEON', 'CADEREYTA JIMENEZ', 'NUEVO LEON', 'cerrado', '2026-02-26', '2026-02-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BRECHA DE CERRO PRIETO SN ATONGO DE ABAJO 67460 CADEREYTA JIMENEZ NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-290-2026 — ACCESO AUTOMOTRIZ SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-290-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-290-2026', 290, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-290-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := 'a538216b-da51-41d7-bdb8-0d1582309b92';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-290-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '689d8614-8e2e-4893-acf2-63003eae46f4', 133, 'JOSE VASCONCELOS 1552 INT 2, JARDINES DE MIRASIERRA 66236 SAN PEDRO GARZA GARCIA NUEVO LEON', 'SAN PEDRO', 'NUEVO LEON', 'cerrado', '2026-02-28', '2026-02-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'JOSE VASCONCELOS 1552 INT 2, JARDINES DE MIRASIERRA 66236 SAN PEDRO GARZA GARCIA NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-260-2026 — CONCRETOS HUASTECA, S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-260-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-260-2026', 260, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-260-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'b1ab6ce8-709a-4d08-a122-b1e2a9899dc9';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-260-2026', '5c207af9-2054-457f-893e-5e16427aae52', '3f07acef-a3c0-48de-a0f7-ddd52555845d', 150.1, 'LIBRAMIENTO PONIENTE KM 12.4 No. 12, LA ESPANITA, ALTAMIRA, TAMAULIPAS, C.P.
89605', 'ALTAMIRA', 'TAMAULIPAS', 'cerrado', '2026-03-01', '2026-03-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LIBRAMIENTO PONIENTE KM 12.4 No. 12, LA ESPANITA, ALTAMIRA, TAMAULIPAS, C.P.
89605', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-351-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-351-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-351-2026', 351, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-351-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '5ccf626e-893e-4913-b7b3-6a768cf1b9bb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-351-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '66a1f177-5ea6-42e4-ae5a-10577d9f96e5', 5, 'C. TOMATE Y TOMATILLO S/N , LOMAS DE POLEO, Juárez, Chihuahua, C.P. 32107', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. TOMATE Y TOMATILLO S/N , LOMAS DE POLEO, Juárez, Chihuahua, C.P. 32107', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-324-2026 — CENTRO DE SERVICIOS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-324-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-324-2026', 324, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-324-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'ee7160f8-9aa6-4bf3-95fb-d58db9527ece';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-324-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'ea7e47e4-9eb0-4ebd-8b82-32ba1ce2334d', 20, 'C. INDUSTRIAS 4303 , NOMBRE DE DIOS, Chihuahua, Chihuahua, C.P. 31135', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-17', '2026-03-17', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-17T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. INDUSTRIAS 4303 , NOMBRE DE DIOS, Chihuahua, Chihuahua, C.P. 31135', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-105-2026 — CRISTINA REYES PEREZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-105-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-105-2026', 105, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-105-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'dab06825-6781-4a49-a1ef-c0d8d6c1447c';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-105-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '7698eca2-07f8-4d05-8701-2f7800e8936e', 2, 'DOM CONOCIDO, S/N, CP. 35133, PASTOR ROUAIX POB GPL', 'GÓMEZ PALACIO', 'DURANGO', 'cerrado', '2026-02-24', '2026-02-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'DOM CONOCIDO, S/N, CP. 35133, PASTOR ROUAIX POB GPL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-354-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-354-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-354-2026', 354, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-354-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'd0c6bc26-768c-4811-a301-507cf92e3b88';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-354-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'a8fa03f2-1b46-4f2b-89c2-87d92146f114', 5, 'C. REMORA Y ESTURION S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. REMORA Y ESTURION S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-355-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-355-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-355-2026', 355, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-355-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '60fa6771-faac-4c27-b003-57abc0d05f7d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-355-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '09e31469-4fb1-436b-b367-426fc5272529', 5, 'C. SALMON Y BALLENA S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. SALMON Y BALLENA S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-374-2026 — C U E D L AC
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-374-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-374-2026', 374, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-374-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '02365a77-c736-4592-918b-2fa5a82434ed';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-374-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'd3f40b2f-f774-4646-b4ac-ef5d105e5e5d', 72.5, 'ENRIQUE DIAZ DE LEON 334, COLONIA AMERICANA, GUADALAJARA, JALISCO, CP. 44160', 'GUADALAJARA', 'JALISCO', 'cerrado', '2026-02-22', '2026-02-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ENRIQUE DIAZ DE LEON 334, COLONIA AMERICANA, GUADALAJARA, JALISCO, CP. 44160', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-162-2026 — LUIS ARTURO ESQUIVEL GRACIDA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-162-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-162-2026', 162, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-162-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'ae6af3f8-7303-461e-8063-60c1bb35b259';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-162-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'b70aab5e-b1df-4eb2-b688-3c74cf9d2c83', 13.2, 'JALISCO, No. 2125, CP. 26830, INDEPENDENCIA', 'SAN JUAN DE SABINAS', 'COAHUILA', 'cerrado', '2026-03-10', '2026-03-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'JALISCO, No. 2125, CP. 26830, INDEPENDENCIA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-360-2026 — GABRIELA TRESPALACIOS LOZANO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-360-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-360-2026', 360, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-360-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '72f4e072-1725-4696-ad77-f4e941ada9ba';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-360-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'ed1c284c-ef94-4b9e-9468-eb21ce51153b', 30, 'C LAGO DE JACALES No 2403, LOMAS DEL SANTUARIO, C.P. 31206, CHIHUAHUA, CHIHUAHUA.', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C LAGO DE JACALES No 2403, LOMAS DEL SANTUARIO, C.P. 31206, CHIHUAHUA, CHIHUAHUA.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-261-2026 — OSCAR GERARDO SOLBES DECANINI
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-261-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-261-2026', 261, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-261-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '59eaefcf-f761-4062-9486-5e1169b3174e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-261-2026', '5c207af9-2054-457f-893e-5e16427aae52', '24cd8deb-6ca1-4310-8579-4fbb6dc93c97', 32.2, 'FRESNO No. 205, AGUILA, TAMPICO, TAMAULIPAS, C.P. 89230', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-03-01', '2026-03-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FRESNO No. 205, AGUILA, TAMPICO, TAMAULIPAS, C.P. 89230', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-356-2026 — JUNTA MUNICIPAL DE AGUA Y SANEAMIENTO DE JUAR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-356-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-356-2026', 356, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-356-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'bc60f02e-035b-452c-a3f9-9bdfa4d38268';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-356-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '264bf589-d9ff-4817-affb-5039380b2865', 5, 'С. НІРОCAMPO Y CONQUISTA S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-15', '2026-03-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'С. НІРОCAMPO Y CONQUISTA S/N , PUERTO DE ANAPRA, Juárez, Chihuahua, C.P. 32107', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-336-2026 — UREBLOCK SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-336-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-336-2026', 336, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-336-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '7b57b5c7-e20a-4804-bc3f-7c4996d0a110';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-336-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'ffdec036-999d-4108-a001-f105430be2fc', 466.2, 'CALLE 4 No. 300, COLONIA LOS ROBLES, ZAPOPAN, JALISCO, CP. 45134', 'ZAPOPAN', 'JALISCO', 'cerrado', '2026-02-22', '2026-02-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE 4 No. 300, COLONIA LOS ROBLES, ZAPOPAN, JALISCO, CP. 45134', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-325-2026 — DAVALOS MEDINA ZULMA BRIGETTE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-325-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-325-2026', 325, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-325-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '8a88ff3a-af51-40d5-92cf-164195c6bd1a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-325-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '9b518c30-7b88-467d-8690-85d1f1fd0cc0', 12.3, 'RANCHO LA FLORIDA S/N COL UNION DE SAN ANTONIO C.P. 47570 UNION DE SAN ANTONIO, JALISCO', 'UNION DE SAN ANTONIO', 'JALISCO', 'cerrado', '2026-03-02', '2026-03-02', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-03-02T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RANCHO LA FLORIDA S/N COL UNION DE SAN ANTONIO C.P. 47570 UNION DE SAN ANTONIO, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-358-2026 — AUDITORIA SUPERIOR DEL ESTADO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-358-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-358-2026', 358, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-358-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '5725f7be-d441-4cb4-a3a1-dd11d66b4b8f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-358-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'b6a4abc6-2e88-4d3f-84ec-d6688f9f674d', 36.69, 'PORFIRIO DIAZ NTE No 1050, FRACC HOGARES MODERNOS, C.P. 87050 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-03-12', '2026-03-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PORFIRIO DIAZ NTE No 1050, FRACC HOGARES MODERNOS, C.P. 87050 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-285-2026 — MAQUINADOS DE SALTILLO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-285-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-285-2026', 285, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-285-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := 'fc3f75f6-9fe7-4d6c-b2d9-cc3b3cc6a3bc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-285-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '4a675783-a859-4042-b16d-4a19e5c8cef5', 31.46, 'EGIDIO REBONATO, No. 1000, CP.  25100,  NAZARIO ORTIZ GARZA', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-02-25', '2026-02-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-02-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'EGIDIO REBONATO, No. 1000, CP.  25100,  NAZARIO ORTIZ GARZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-332-2026 — GORDITAS EL ATORON DE SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-332-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-332-2026', 332, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-332-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '1e82b17e-d43d-49dd-b756-c5c1d60efbdc';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-332-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', 'd9b06af4-6c94-4887-b89b-13a122ab4b8b', 44, 'C. PITHAYA 7096 , EL GRANJERO, Juárez, Chihuahua, C.P. 32690', 'JUAREZ', 'CHIHUAHUA', 'cerrado', '2026-03-19', '2026-03-19', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-19T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C. PITHAYA 7096 , EL GRANJERO, Juárez, Chihuahua, C.P. 32690', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-381-2026 — DENISSE ALEJANDRA VELASQUEZ ROMERO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-381-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-381-2026', 381, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-381-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'adf9fe22-8e16-4e77-ba9e-b444b5c8498f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-381-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '5b5c7b6e-7784-438d-a9a1-2b75c982839f', 22.8, 'BLVD GASPAR LUKEN No 795, COLONIA SAN BOSCO, HERMOSILLO, SONORA, CP. 83177', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-03-09', '2026-03-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-03-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD GASPAR LUKEN No 795, COLONIA SAN BOSCO, HERMOSILLO, SONORA, CP. 83177', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-368-2026 — RODOLFO GONZALEZ IGLESIAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-368-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-368-2026', 368, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-368-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '86c350a7-e6e0-42b6-ab32-1e47fb8deb06';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-368-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '610f7e24-0303-4abd-b8d8-04d64495a7d6', 6, 'AV CUAUHTEMOC S/N, ALVARO OBREGON, C.P. 31610, CUAUHTEMOC, CHIHUAHUA.', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-03-15', '2026-03-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV CUAUHTEMOC S/N, ALVARO OBREGON, C.P. 31610, CUAUHTEMOC, CHIHUAHUA.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-361-2026 — GSF FITNESS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-361-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-361-2026', 361, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-361-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '0b1176f4-e424-4188-af30-76e58f864608';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-361-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '053f0aa1-31fb-4e05-a082-bd8d8bdc0e9d', 120, 'C FEDOR DOSTOYEVSKI No 1702, INT S2EXT, ALAMEDAS I-II-III-IV-V, C.P. 31136, CHIHUAHUA, CHIHUAHUA.', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'C FEDOR DOSTOYEVSKI No 1702, INT S2EXT, ALAMEDAS I-II-III-IV-V, C.P. 31136, CHIHUAHUA, CHIHUAHUA.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-342-2026 — JOSE BENITO SALDIVAR ACOSTA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-342-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-342-2026', 342, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-342-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'e7a5c941-678f-4ee9-8b87-ee0e9d286127';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-342-2026', '5c207af9-2054-457f-893e-5e16427aae52', '9577f8e2-85a5-46f7-b2a5-3f076f8a6c56', 10, 'CALLE PRIMERA No. 92, LAS FUENTES FRAC, REYNOSA, TAMAULIPAS, C.P. 88710', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-03-12', '2026-03-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE PRIMERA No. 92, LAS FUENTES FRAC, REYNOSA, TAMAULIPAS, C.P. 88710', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-345-2026 — CAMIONERA DE JALISCO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-345-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-345-2026', 345, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-345-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '7e0dd955-dab1-4ea6-b35b-104f509e4618';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-345-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '0ff63603-65ba-47aa-b119-5c143394ae58', 8.19, 'CARRETERA FEDERAL 85 TEPATITLAN-YAHUALICA #1639 COL. LOS ADOBES C.P. 47656 TEPATITLAN DE MORELOS, JALISCO', 'TEPATITLAN DE MORELOS', 'JALISCO', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA FEDERAL 85 TEPATITLAN-YAHUALICA #1639 COL. LOS ADOBES C.P. 47656 TEPATITLAN DE MORELOS, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-308-2026 — AYALA MICHEL FRANCISCO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-308-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-308-2026', 308, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-308-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := 'c8ea1fbb-a406-40e6-a817-2f1065123207';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-308-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', 'c120c13b-5332-4348-b64e-c56d0c8232d9', 8.06, 'KM9 CARRETERA A GUADALAJARA EL VERDE S/N COL. EL SALTO C.P. 45680 EL SALTO, JALISCO', 'EL SALTO', 'JALISCO', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'KM9 CARRETERA A GUADALAJARA EL VERDE S/N COL. EL SALTO C.P. 45680 EL SALTO, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-311-2026 — EMPAQ Y COMER LA TRADICIONAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-311-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-311-2026', 311, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-311-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '7fdda741-ca58-493a-a3c5-d3f25b049e05';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-311-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'eb05ebf9-c296-4440-b0d9-b532295880f9', 50, 'AMERICA ESPAÑOLA No 236, PEDRO SOSA, C.P. 87120 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AMERICA ESPAÑOLA No 236, PEDRO SOSA, C.P. 87120 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-312-2026 — EMPAQ Y COMER LA TRADICIONAL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-312-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-312-2026', 312, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-312-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '7048510e-0e81-435e-a88e-2ea65869f898';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-312-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', 'eb05ebf9-c296-4440-b0d9-b532295880f9', 53.32, 'ZEFERINO FAJARDO 430, FRACC. COL. DEL VALLE, C.P. 87018 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-03-04', '2026-03-04', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-04T09:00:00-07:00'::TIMESTAMPTZ, 180, 'ZEFERINO FAJARDO 430, FRACC. COL. DEL VALLE, C.P. 87018 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-183-2026 — LOS MOLINOS EN ACCION ASOCIACION CIVIL
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-183-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-183-2026', 183, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-183-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '953fb352-f643-4e9c-ac21-80b89d2942ef';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-183-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'dba6baa6-09a3-4d9f-b9de-e2ca104ed723', 49.53, 'FCO ARIZPE SN, LOS MOLINOS 25298, SALTILLO COAHUILA DE ZARAGOZA', 'SALTILLO', 'COAHUILA', 'cerrado', '2026-02-11', '2026-02-11', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-11T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FCO ARIZPE SN, LOS MOLINOS 25298, SALTILLO COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-382-2026 — PROCESADORA Y EMPACADORA GANADERA DE SONORA S
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-382-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-382-2026', 382, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-382-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '091d6cca-2c6f-416b-bb6d-cd47e4c889db';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-382-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '9b93df84-9570-43a0-867a-a22d74a83dae', 288, 'TARAHUMARAS No 11, PARQUE INDUSTRIAL, HERMOSILLO, SONORA, CP. 83299', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-03-09', '2026-03-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-03-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'TARAHUMARAS No 11, PARQUE INDUSTRIAL, HERMOSILLO, SONORA, CP. 83299', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-383-2026 — MULTI ESPUMAS SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-383-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-383-2026', 383, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-383-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '9d51a402-e28d-43c2-b8dc-ef34801514e8';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-383-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'ccb5aa73-40fd-4be1-804d-8e232d0dffb6', 80.6, 'Carretera Cajititlán N° 600 A, COLONIA Balcones de la Calera, Tlajomulco de Zúñiga, JALISCO, CP. 45678', 'Tlajomulco de Zúñiga', 'JALISCO', 'cerrado', '2026-02-22', '2026-02-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Carretera Cajititlán N° 600 A, COLONIA Balcones de la Calera, Tlajomulco de Zúñiga, JALISCO, CP. 45678', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-380-2026 — CONDOMINIO V MARINA VALLARTA A.C.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-380-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-380-2026', 380, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-380-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '9e3a1d9e-9a49-4053-9230-a582135acb4b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-380-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'ccf91ca3-9f4a-4c53-a157-ead0b6610dad', 165, 'Paseo de La Marina No. 180, COLONIA Marina Vallarta, PUERTO VALLARTA, JALISCO, CP. 48335', 'PUERTO VALLARTA', 'JALISCO', 'cerrado', '2026-02-07', '2026-02-07', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-07T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Paseo de La Marina No. 180, COLONIA Marina Vallarta, PUERTO VALLARTA, JALISCO, CP. 48335', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-378-2026 — SEMINARIO ARQUIDIOCESANO DE CHIHUAHUA AR
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-378-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-378-2026', 378, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-378-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := 'e08554d1-893b-42a4-afca-522f4f2337ba';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-378-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '7fbaca51-5dba-45a7-8889-2801b509a1d0', 30, 'RCHO SAN JUAN LOTE 632 5 KM 81 , ALTA VISTA, Delicias, Chihuahua, C.P. 33115', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-21', '2026-03-21', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-21T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RCHO SAN JUAN LOTE 632 5 KM 81 , ALTA VISTA, Delicias, Chihuahua, C.P. 33115', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-283-2026 — FABIAN REYNA MENDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-283-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-283-2026', 283, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-283-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '75073ee3-202a-42d8-bd2c-f211f0033cb2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-283-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c21056f2-b8b4-4d3c-a958-9cca741d1b9b', 50.82, 'LIB. EMILIO MENDOZA C, No. 1805, CP. 26236,  LAS AMERICAS ACUÑA', 'ACUÑA', 'COAHUILA', 'cerrado', '2026-03-10', '2026-03-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LIB. EMILIO MENDOZA C, No. 1805, CP. 26236,  LAS AMERICAS ACUÑA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-347-2026 — INSTITUTO TECNOLOGICO Y DE ESTUDIOS SUPERIORE
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-347-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-347-2026', 347, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-347-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'b1cb1313-38e3-4493-ba87-02ecc49d0afa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-347-2026', '5c207af9-2054-457f-893e-5e16427aae52', 'd3a2ebb3-ef45-4c74-a8be-73d2f4175818', 100, 'AV PASEO DE LA REFORMA 182 A, LOMAS DE CUERNAVACA, TEMIXCO, MORELOS, C.P. 62584', 'TEMIXCO', 'MORELOS', 'cerrado', '2026-03-16', '2026-03-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV PASEO DE LA REFORMA 182 A, LOMAS DE CUERNAVACA, TEMIXCO, MORELOS, C.P. 62584', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-263-2026 — POWER PROCESS CONTROL, S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-263-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-263-2026', 263, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-263-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '7e022c77-90ec-4e2f-96fe-420cf16c12e4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-263-2026', '5c207af9-2054-457f-893e-5e16427aae52', '265546ee-d21d-4465-bedc-698f70452a7c', 21.25, 'FAJA DE ORO No. 305, PETROLERA, TAMPICO, TAMAULIPAS, C.P. 89110', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-03-01', '2026-03-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'FAJA DE ORO No. 305, PETROLERA, TAMPICO, TAMAULIPAS, C.P. 89110', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-393-2026 — FABRICA DE JABON LA CORONA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-393-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-393-2026', 393, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-393-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := '7b6b8876-9565-4ba9-9621-1d9952759d53';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-393-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'a710451e-a1e5-479b-9ea1-fba3bbe1ed42', 20, 'BLVD DE LOS GANADEROS No 496, COLONIA LAS LOMAS, HERMOSILLO, SONORA, CP. 83293', 'HERMOSILLO', 'SONORA', 'cerrado', '2026-03-10', '2026-03-10', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-03-10T09:00:00-07:00'::TIMESTAMPTZ, 180, 'BLVD DE LOS GANADEROS No 496, COLONIA LAS LOMAS, HERMOSILLO, SONORA, CP. 83293', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-363-2026 — VILLARREAL DE LOS REYES ZAIDA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-363-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-363-2026', 363, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-363-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'b37a1a8e-e471-4935-8034-38dd67ca6e0d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-363-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '3cf679eb-52b6-4a35-8e4d-75633a3afd0e', 16, 'PAEO DE LOS LAGOS M1 L11, FRAC LOS LAGOS, C.P. 87000 VICTORIA TAMAULIPAS', 'VICTORIA', 'TAMAULIPAS', 'cerrado', '2026-03-18', '2026-03-18', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-18T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PAEO DE LOS LAGOS M1 L11, FRAC LOS LAGOS, C.P. 87000 VICTORIA TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-388-2026 — JORGE ALBERTO FUENTES HERNANDEZ
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-388-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-388-2026', 388, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-388-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '2940a3bf-16f4-4eb1-80b0-2f085e97bee7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-388-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'c307d93f-3a3e-4781-8878-485509dad9f0', 6.15, 'CARRETERA NACIONAL KM 215, S/N, CP. 67608, CONGREGACION CALLES', 'MONTEMORELOS', 'NUEVO LEÓN', 'cerrado', '2026-03-23', '2026-03-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA NACIONAL KM 215, S/N, CP. 67608, CONGREGACION CALLES', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-367-2026 — PRODUCTOS LAMINADOS DE PINO Y ENCINO S. DE R.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-367-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-367-2026', 367, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-367-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '8048683e-7cf7-4007-ad14-4189413c14f0';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-367-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'e0a52c03-00c1-4a12-898b-606a006cdf03', 20, 'km 15.5 CARRETERA CHIHUAHUA-CUAUHTEMOC, FRESNO, C.P. 31625, CHIHUAHUA, CHIHUAHUA.', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'km 15.5 CARRETERA CHIHUAHUA-CUAUHTEMOC, FRESNO, C.P. 31625, CHIHUAHUA, CHIHUAHUA.', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-392-2026 — SERVICIOS DE MAQUINADO Y REFACCIONES DE IMURI
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-392-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-392-2026', 392, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-392-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'e91be981-78af-4d31-9e3f-63f5020d7378';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-392-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'bdeff44e-ccff-4f91-ab61-9947740e7543', 18.3, 'AVENIDA 21 DE MARZO No. 19, COLONIA EL ESTADIO DE IMURIS, IMURIS, SONORA, CP. 84125', 'IMURIS', 'SONORA', 'cerrado', '2026-02-16', '2026-02-16', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-02-16T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVENIDA 21 DE MARZO No. 19, COLONIA EL ESTADIO DE IMURIS, IMURIS, SONORA, CP. 84125', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-400-2026 — 7-ELEVEN MEXICO S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-400-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-400-2026', 400, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-400-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '9ad9273e-5115-4b1e-a059-baf30f7d4f9e';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-400-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '40871c5f-0cae-46a3-a656-b8f08770b4ac', 14.04, 'Ctra al Verde 1 a Carr Sn Mart S/N, San Martín de las Flores, Tlaquepaque, Jalisco, CP. 45620', 'Tlaquepaque', 'Jalisco', 'cerrado', '2026-02-08', '2026-02-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Ctra al Verde 1 a Carr Sn Mart S/N, San Martín de las Flores, Tlaquepaque, Jalisco, CP. 45620', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-399-2026 — 7-ELEVEN MEXICO S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-399-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-399-2026', 399, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-399-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := '07470556-8c2b-41d0-ac5a-32da4285b028';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-399-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '40871c5f-0cae-46a3-a656-b8f08770b4ac', 14.04, 'Calzada del Ejército No.968 Int A, Quinta Velarde, Guadalajara,  Jalisco, CP. 44430', 'Guadalajara', 'Jalisco', 'cerrado', '2026-02-08', '2026-02-08', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-02-08T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Calzada del Ejército No.968 Int A, Quinta Velarde, Guadalajara,  Jalisco, CP. 44430', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-402-2026 — ENTROQUE SANTA CLARA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-402-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-402-2026', 402, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-402-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'b273bdd6-0a7b-4e01-85b3-1ca330867fc7';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-402-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'd35ba77e-5f66-4f8f-a668-1781c8c0eeca', 20, 'Sin Nombre entre Blvd. S/N , COLONIA Santa Clara, GUAYMAS, SONORA, CP. 85500', 'GUAYMAS', 'SONORA', 'cerrado', '2026-03-13', '2026-03-13', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-03-13T09:00:00-07:00'::TIMESTAMPTZ, 180, 'Sin Nombre entre Blvd. S/N , COLONIA Santa Clara, GUAYMAS, SONORA, CP. 85500', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-384-2026 — NUEVA WAL MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-384-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-384-2026', 384, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-384-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'd206f62e-7c48-4ec2-919a-fc97909fa1e4';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-384-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '4a5a78db-eb16-4fd4-b991-d53652ed111b', 20, 'LAS HACIENDAS MONTECARLO LT 26 MZ 118 No, 203, COLONIA Las Haciendas, PESQUERIA , NUEVO LEON, CP. 66655', 'PESQUERIA', 'NUEVO LEON', 'cerrado', '2026-03-24', '2026-03-24', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-24T09:00:00-07:00'::TIMESTAMPTZ, 180, 'LAS HACIENDAS MONTECARLO LT 26 MZ 118 No, 203, COLONIA Las Haciendas, PESQUERIA , NUEVO LEON, CP. 66655', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-386-2026 — NUEVA WAL MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-386-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-386-2026', 386, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-386-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'c89a2f7d-3ba2-4b6b-9dd1-9d924637eb39';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-386-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '4a5a78db-eb16-4fd4-b991-d53652ed111b', 200, 'AV. SANTA ISABEL LT1 No. 703, COLONIA SANTA ISABEL HDA CD, Cadereyta Jiménez, Nuevo León, CP. 67256', 'Cadereyta Jiménez', 'Nuevo León', 'cerrado', '2026-03-25', '2026-03-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV. SANTA ISABEL LT1 No. 703, COLONIA SANTA ISABEL HDA CD, Cadereyta Jiménez, Nuevo León, CP. 67256', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-385-2026 — NUEVA WAL MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-385-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-385-2026', 385, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-385-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'f8491a4e-211d-43a4-89f8-d04301f89f91';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-385-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '4a5a78db-eb16-4fd4-b991-d53652ed111b', 21.76, 'M. M. DEL LLANO LTE 2 MZ 43 No. 141, COLONIA Lázaro Cárdenas, Cadereyta Jiménez, Nuevo León, CP. 67483', 'Cadereyta Jiménez', 'Nuevo León', 'cerrado', '2026-03-25', '2026-03-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'M. M. DEL LLANO LTE 2 MZ 43 No. 141, COLONIA Lázaro Cárdenas, Cadereyta Jiménez, Nuevo León, CP. 67483', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-398-2026 — NUEVA WAL MART DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-398-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-398-2026', 398, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-398-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '6f78c4e7-e558-4381-a518-aefa40005691';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-398-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '4a5a78db-eb16-4fd4-b991-d53652ed111b', 20, 'AV A LAS ADJUNTAS LT 2 MZ 111 No. 239, COLONIA BUGAMBILIAS, MONTEMORELOS, NUEVO LEON, CP. 67535', 'MONTEMORELOS', 'NUEVO LEON', 'cerrado', '2026-03-25', '2026-03-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV A LAS ADJUNTAS LT 2 MZ 111 No. 239, COLONIA BUGAMBILIAS, MONTEMORELOS, NUEVO LEON, CP. 67535', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-396-2026 — ORGANO SUPERIOR DE AUDITORÍA Y FISCALIZACIÓN 
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-396-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-396-2026', 396, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-396-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'a2a6fd3f-4a98-4501-b153-806f5c102c39' WHERE id = v_folio_id;
  v_exp_id := 'b351f6cb-8627-47a3-b82e-20902f1e36ce';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-396-2026', 'a2a6fd3f-4a98-4501-b153-806f5c102c39', 'e124092b-97c8-43ae-9712-f7e191f54c42', 30, 'PARIS ESQ O INDICO S/N, COLONIA  Lomas Vistahermosa,  Colima, COLIMA, CP. 28016', 'Colima', 'COLIMA', 'cerrado', '2026-03-26', '2026-03-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'a2a6fd3f-4a98-4501-b153-806f5c102c39', '2026-03-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PARIS ESQ O INDICO S/N, COLONIA  Lomas Vistahermosa,  Colima, COLIMA, CP. 28016', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-341-2026 — G.S.W. DE MEXICO S DE RL DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-341-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-341-2026', 341, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-341-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := 'c731d302-60fc-4735-a554-fe1d4babeb7d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-341-2026', '5c207af9-2054-457f-893e-5e16427aae52', '2e59b6ce-9eba-4ce3-8f73-f7f80451f7d9', 498, 'AVE. DEL PARQUE L-3, 4 Y 5, SN, PARQUE INDUSTRIAL VILLA FLORIDA, REYNOSA, TAMAULIPAS, C.P. 88715', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-03-14', '2026-03-14', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-14T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE. DEL PARQUE L-3, 4 Y 5, SN, PARQUE INDUSTRIAL VILLA FLORIDA, REYNOSA, TAMAULIPAS, C.P. 88715', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-262-2026 — REGINO TREVIÑO CASTRO
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-262-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-262-2026', 262, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-262-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '0b87446a-deed-4c92-b9a6-a81477b3665b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-262-2026', '5c207af9-2054-457f-893e-5e16427aae52', '3433923a-55b3-4d82-9a2f-9cb05831b0b2', 44.7, 'CARRETERA TAMPICO MANTE KM 11.5 No. 115, TAMPICO-ALTAMIRA, ALTAMIRA, TAMAULIPAS, C.P. 89605', 'ALTAMIRA', 'TAMAULIPAS', 'cerrado', '2026-03-01', '2026-03-01', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-01T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA TAMPICO MANTE KM 11.5 No. 115, TAMPICO-ALTAMIRA, ALTAMIRA, TAMAULIPAS, C.P. 89605', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-390-2026 — BURGOS PLUS GASOLINERAS S.A DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-390-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-390-2026', 390, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-390-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := 'bf7586cf-f108-4d6f-8011-ade5ec4a362a';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-390-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '3fb69784-060a-4274-ae07-8b42f5256851', 20.35, 'MARIANO MATAMOROS No.120, CENTRO REYNOSA, C.P. 88500, EN EL MUNICIPIO DE REYNOSA, TAMAULIPAS', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-03-27', '2026-03-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MARIANO MATAMOROS No.120, CENTRO REYNOSA, C.P. 88500, EN EL MUNICIPIO DE REYNOSA, TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-329-2026 — CRUZ HERRERA ROSA MARIA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-329-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-329-2026', 329, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-329-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '391d87c5-c6b4-4082-92a1-c494e91f3c3f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-329-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '39d0b62b-446a-4e48-b8c6-55a8f9c74ff3', 10, 'RCHO SAN JUAN LOTE 632 5 KM 81 , ALTA VISTA, Delicias, Chihuahua, C.P. 33115', 'DELICIAS', 'CHIHUAHUA', 'cerrado', '2026-03-12', '2026-03-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'RCHO SAN JUAN LOTE 632 5 KM 81 , ALTA VISTA, Delicias, Chihuahua, C.P. 33115', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-228-2026 — GDL CORRUGADOS S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-228-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-228-2026', 228, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-228-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '307fcdb0-1b3a-4b39-ac0f-5192bfbeaa98';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-228-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '18170710-0330-4835-b66a-3137b8036506', 496, 'CARRETERA EL SALTO LA CAPILLA KM2 S/N COL. LA CAPILLA IXTLAHUACAN DE LOS MEMBRILLOS C.P. 45870 LA CAPILLA JALISCO', 'LA CAPILLA', 'JALISCO', 'cerrado', '2026-03-12', '2026-03-12', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-03-12T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CARRETERA EL SALTO LA CAPILLA KM2 S/N COL. LA CAPILLA IXTLAHUACAN DE LOS MEMBRILLOS C.P. 45870 LA CAPILLA JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-391-2026 — BURGOS PLUS GASOLINERAS S.A DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-391-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-391-2026', 391, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-391-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '4265bb74-9a89-4254-8bbd-b13660e0ed98' WHERE id = v_folio_id;
  v_exp_id := '5136d094-e996-4cdf-9321-7d01c4b9588d';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-391-2026', '4265bb74-9a89-4254-8bbd-b13660e0ed98', '3fb69784-060a-4274-ae07-8b42f5256851', 23.65, 'HERON RAMIREZ No. 1805, COL. RODRIGUEZ, C.P. 88630, CD. REYNOSA, TAMAULIPAS', 'REYNOSA', 'TAMAULIPAS', 'cerrado', '2026-03-27', '2026-03-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '4265bb74-9a89-4254-8bbd-b13660e0ed98', '2026-03-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'HERON RAMIREZ No. 1805, COL. RODRIGUEZ, C.P. 88630, CD. REYNOSA, TAMAULIPAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-401-2026 — SARA JUDITH IZAGUIRRE FARIAS
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-401-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-401-2026', 401, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-401-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '1f5dc65a-3be1-42e7-ad7b-a1793023a2fe';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-401-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', 'a568409e-78f2-4d0a-876a-18f8f97c7353', 15.84, 'MADERO Y MOCTEZUMA, S/N, CP. 26850, COMERCIAL', 'SAN JUAN DE SABINAS', 'COAHUILA', 'cerrado', '2026-03-28', '2026-03-28', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-28T09:00:00-07:00'::TIMESTAMPTZ, 180, 'MADERO Y MOCTEZUMA, S/N, CP. 26850, COMERCIAL', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-370-2026 — LENOMEX SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-370-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-370-2026', 370, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-370-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '543d5666-52cc-458d-ae32-2bd0cb80ff1d' WHERE id = v_folio_id;
  v_exp_id := '63279793-4ef2-4c9a-9984-a8b547d4a673';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-370-2026', '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '43ad9cf4-6b9c-4023-8c8d-9a9e58a9b318', 460, 'AVE LUIS D COLOSIO, Km 4, CP. 66363, COLONIA LAS SOMBRILLAS', 'SANTA CATARINA', 'NUEVO LEÓN', 'cerrado', '2026-03-22', '2026-03-22', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '543d5666-52cc-458d-ae32-2bd0cb80ff1d', '2026-03-22T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE LUIS D COLOSIO, Km 4, CP. 66363, COLONIA LAS SOMBRILLAS', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-394-2026 — 7 ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-394-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-394-2026', 394, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-394-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '69e06c50-7512-459c-8803-2833c81ba6aa';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-394-2026', '5c207af9-2054-457f-893e-5e16427aae52', '9352cbf9-3b43-452e-b6e8-ce7c845e0309', 21.06, 'OLIVOS No. 113, ARBOLEDAS DE SAN ROQUE, JUAREZ, NUEVO LEON, C.P. 67280', 'JUAREZ', 'NUEVO LEON', 'cerrado', '2026-03-26', '2026-03-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'OLIVOS No. 113, ARBOLEDAS DE SAN ROQUE, JUAREZ, NUEVO LEON, C.P. 67280', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-350-2026 — FEHR HILDEBRAND WILHELM
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-350-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-350-2026', 350, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-350-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'dae0d247-7908-4d9c-a834-92c5883cdac3' WHERE id = v_folio_id;
  v_exp_id := '82ae77c4-d3ea-4bbe-94cd-2daf3161fe9b';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-350-2026', 'dae0d247-7908-4d9c-a834-92c5883cdac3', '97fb9c1a-91a6-41b1-a6db-200f3e8b3b6c', 124, 'САМРО ЗВ 137 , САМРО ЗВ, Cuauhtémoc, Chihuahua, C.P. 31607', 'CUAUHTEMOC', 'CHIHUAHUA', 'cerrado', '2026-03-25', '2026-03-25', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'dae0d247-7908-4d9c-a834-92c5883cdac3', '2026-03-25T09:00:00-07:00'::TIMESTAMPTZ, 180, 'САМРО ЗВ 137 , САМРО ЗВ, Cuauhtémoc, Chihuahua, C.P. 31607', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-395-2026 — 7 ELEVEN MEXICO SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-395-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-395-2026', 395, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-395-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '27dacf2e-887f-436c-9939-9f1f010e995f';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-395-2026', '5c207af9-2054-457f-893e-5e16427aae52', '9352cbf9-3b43-452e-b6e8-ce7c845e0309', 15.79, 'AVE RUIZ CORTINEZ No. 1400, BELLO AMANECER, GUADALUPE, NUEVO LEON, C.P. 67196', 'GUADALUPE', 'NUEVO LEON', 'cerrado', '2026-03-26', '2026-03-26', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-26T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE RUIZ CORTINEZ No. 1400, BELLO AMANECER, GUADALUPE, NUEVO LEON, C.P. 67196', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-409-2026 — ALMACENES IBARRA SA DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-409-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-409-2026', 409, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-409-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '5c207af9-2054-457f-893e-5e16427aae52' WHERE id = v_folio_id;
  v_exp_id := '595d13ca-5bbd-4dcc-9c7c-4baba48fe3d2';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-409-2026', '5c207af9-2054-457f-893e-5e16427aae52', '67349495-36cf-4a34-b37f-f7bbc3ad95d6', 115.44, 'AVE MONTERREY No. 301, COLONIA ENRIQUE CARDENAS GONZALEZ, TAMPICO, TAMAULIPAS, CP. 89309', 'TAMPICO', 'TAMAULIPAS', 'cerrado', '2026-03-27', '2026-03-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '5c207af9-2054-457f-893e-5e16427aae52', '2026-03-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AVE MONTERREY No. 301, COLONIA ENRIQUE CARDENAS GONZALEZ, TAMPICO, TAMAULIPAS, CP. 89309', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-362-2026 — COMERCIAL LLANTERA TAPATIA S.A. DE C.V.
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-362-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-362-2026', 362, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-362-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = '31442556-3938-4c4b-8bd5-b79893b556a0' WHERE id = v_folio_id;
  v_exp_id := '35c22a6a-b111-4995-9297-49cc5e22f967';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-362-2026', '31442556-3938-4c4b-8bd5-b79893b556a0', '153ea29f-98c1-4920-80d6-3115e54ebdb4', 18.6, 'CIRCUITO METROPOLITANO SUR #69 INT B02 COL. CAMPO SUR C.P. 45656 TLAJOMULCO DE ZUÑIGA, JALISCO', 'TLAJOMULCO DE ZUÑIGA', 'JALISCO', 'cerrado', '2026-03-09', '2026-03-09', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, '31442556-3938-4c4b-8bd5-b79893b556a0', '2026-03-09T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CIRCUITO METROPOLITANO SUR #69 INT B02 COL. CAMPO SUR C.P. 45656 TLAJOMULCO DE ZUÑIGA, JALISCO', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-376-2026 — GSF FITNESS SAPI DE CV
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-376-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-376-2026', 376, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-376-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'cf63591d-cb83-4cdf-9b36-5ce20a50149c' WHERE id = v_folio_id;
  v_exp_id := 'dad26803-df27-42d5-ab1d-2da1ccdb7983';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-376-2026', 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', 'a0476799-3c58-49d2-83da-8d5ae6314bf4', 150, 'AV EQUUS No 10202, JARDINES DEL ORIENTE, C.P 31385, CHIUHUAHUA, CHIUHUAHUA', 'CHIHUAHUA', 'CHIHUAHUA', 'cerrado', '2026-03-15', '2026-03-15', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'cf63591d-cb83-4cdf-9b36-5ce20a50149c', '2026-03-15T09:00:00-07:00'::TIMESTAMPTZ, 180, 'AV EQUUS No 10202, JARDINES DEL ORIENTE, C.P 31385, CHIUHUAHUA, CHIUHUAHUA', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-252-2026 — MARIA DE JESUS YAÑEZ SILVA
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-252-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-252-2026', 252, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-252-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '081b8733-3dda-485f-a873-d7adc0525287';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-252-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '4fb0dda3-3872-4b67-8cfa-6328bee92284', 27.06, 'CALLE UNO 601, BALCONES DE SAN MIGUEL 67115, GUADALUPE NUEVO LEON', 'APODACA', 'NUEVO LEON', 'cerrado', '2026-02-23', '2026-02-23', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-02-23T09:00:00-07:00'::TIMESTAMPTZ, 180, 'CALLE UNO 601, BALCONES DE SAN MIGUEL 67115, GUADALUPE NUEVO LEON', 'realizada') ON CONFLICT DO NOTHING;

  -- UIIE-253-2026 — LUIS GERARDO ZERTUCHE SANTILLAN
  SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-253-2026';
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial, asignado)
    VALUES ('UIIE-253-2026', 253, true)
    ON CONFLICT (numero_folio) DO NOTHING RETURNING id INTO v_folio_id;
    IF v_folio_id IS NULL THEN SELECT id INTO v_folio_id FROM public.folios_lista_control WHERE numero_folio = 'UIIE-253-2026'; END IF;
  END IF;
  UPDATE public.folios_lista_control SET asignado = true, asignado_a = 'c3cd3e66-c075-4fdf-be74-c981dac882cb' WHERE id = v_folio_id;
  v_exp_id := '0e64932d-a157-4e4e-abfe-e04d625f82fb';
  INSERT INTO public.expedientes (id, folio_id, numero_folio, inspector_id, cliente_id, kwp, direccion_proyecto, ciudad, estado_mx, status, fecha_inicio, fecha_cierre, observaciones)
  VALUES (v_exp_id, v_folio_id, 'UIIE-253-2026', 'c3cd3e66-c075-4fdf-be74-c981dac882cb', 'c579bb02-99bb-48af-8d32-d4937f6d15c8', 2.4, 'PERCELA 143 Z1P2, EJIDAL VILLA UNION COAHUILA DE ZARAGOZA', 'ALLENDE', 'NUEVO LEON', 'cerrado', '2026-01-27', '2026-01-27', NULL) ON CONFLICT DO NOTHING;
  INSERT INTO public.inspecciones_agenda (expediente_id, inspector_id, fecha_hora, duracion_min, direccion, status)
  VALUES (v_exp_id, 'c3cd3e66-c075-4fdf-be74-c981dac882cb', '2026-01-27T09:00:00-07:00'::TIMESTAMPTZ, 180, 'PERCELA 143 Z1P2, EJIDAL VILLA UNION COAHUILA DE ZARAGOZA', 'realizada') ON CONFLICT DO NOTHING;
END $$;

-- Restaurar FK enforcement
SET session_replication_role = DEFAULT;

-- Verificación
SELECT
  (SELECT COUNT(*) FROM public.usuarios WHERE rol IN ('inspector','inspector_responsable')) AS inspectores,
  (SELECT COUNT(*) FROM public.clientes)    AS clientes,
  (SELECT COUNT(*) FROM public.expedientes) AS expedientes,
  (SELECT COUNT(*) FROM public.inspecciones_agenda WHERE status='realizada') AS inspecciones_realizadas,
  (SELECT COUNT(*) FROM public.folios_lista_control WHERE asignado=true) AS folios_usados;
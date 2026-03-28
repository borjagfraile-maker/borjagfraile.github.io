import * as THREE from 'three';

// ========== DATOS DE SILOS ICBM ==========
export const ussrSilosData = [
    { name: "Plesetsk", lat: 62.7, lon: 40.3, missiles: 80, type: "SS-11/SS-19", rangeKm: 10000 },
    { name: "Tatishchevo (Sarátov)", lat: 51.7, lon: 45.6, missiles: 120, type: "SS-19", rangeKm: 10000 },
    { name: "Dombarovsky (Yasny)", lat: 50.8, lon: 59.5, missiles: 60, type: "SS-18", rangeKm: 16000 },
    { name: "Kozelsk", lat: 54.0, lon: 35.8, missiles: 80, type: "SS-19", rangeKm: 10000 },
    { name: "Kartaly", lat: 53.1, lon: 60.6, missiles: 70, type: "SS-18", rangeKm: 16000 },
    { name: "Uzhur", lat: 55.3, lon: 89.8, missiles: 90, type: "SS-18", rangeKm: 16000 },
    { name: "Aleysk", lat: 52.5, lon: 82.8, missiles: 50, type: "SS-25 Topol", rangeKm: 10000 }
];

export const usaBasesData = [
    { name: "Minot AFB", lat: 48.4155, lon: -101.3576, missiles: 150, type: "Minuteman III", rangeKm: 13000 },
    { name: "Malmstrom AFB", lat: 47.5047, lon: -111.187, missiles: 150, type: "Minuteman III", rangeKm: 13000 },
    { name: "F.E. Warren AFB", lat: 41.1335, lon: -104.871, missiles: 150, type: "Minuteman III", rangeKm: 13000 },
    { name: "Ellsworth AFB", lat: 44.1455, lon: -103.1035, missiles: 150, type: "Minuteman II", rangeKm: 11000 },
    { name: "Whiteman AFB", lat: 38.7304, lon: -93.5479, missiles: 150, type: "Minuteman II", rangeKm: 11000 },
    { name: "Grand Forks AFB", lat: 47.9611, lon: -97.401, missiles: 150, type: "Minuteman III", rangeKm: 13000 },
    { name: "Little Rock AFB", lat: 35.0165, lon: -92.5625, missiles: 18, type: "Titan II", rangeKm: 15000 }
];

// ========== FUNCIONES AUXILIARES PARA SILOS ==========
function createPointedSiloIcon(sizeScale = 0.0028, color = 0xbcbcbc) {
    const baseWidth = 0.0009, bodyHeight = 0.0032, extendedHeight = bodyHeight * 1.5, tipHeight = 0.0014;
    const totalHeight = extendedHeight + tipHeight;
    const halfWidth = baseWidth / 2;
    const bottomY = -totalHeight/2, midY = bottomY + extendedHeight, tipY = totalHeight/2;
    const points = [
        new THREE.Vector3(-halfWidth, bottomY, 0),
        new THREE.Vector3(-halfWidth, midY, 0),
        new THREE.Vector3(0, tipY, 0),
        new THREE.Vector3(halfWidth, midY, 0),
        new THREE.Vector3(halfWidth, bottomY, 0),
        new THREE.Vector3(-halfWidth, bottomY, 0)
    ];
    const scale = sizeScale / 0.003;
    const scaledPoints = points.map(p => p.clone().multiplyScalar(scale));
    const geometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: color }));
}

function addSilosFromData(scene, basesArray, siloColor, sideLabel, geoToVector3, alignToNorth) {
    const items = [];
    basesArray.forEach(base => {
        const numIcons = Math.ceil(base.missiles / 50);
        for (let i = 0; i < numIcons; i++) {
            let latOffset = (Math.random() - 0.5) * 1.5;
            let lonOffset = (Math.random() - 0.5) * 2.0;
            let finalLat = Math.min(70, Math.max(30, base.lat + latOffset));
            let finalLon = Math.min(150, Math.max(-125, base.lon + lonOffset));
            const pos = geoToVector3(finalLon, finalLat);
            const siloIcon = createPointedSiloIcon(0.0025, siloColor);
            siloIcon.position.copy(pos);
            alignToNorth(siloIcon, pos, finalLat, finalLon);
            scene.add(siloIcon);
            const hitMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
            const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), hitMat);
            hitSphere.position.copy(pos);
            hitSphere.userData = {
                type: "silo",
                baseName: base.name,
                missileType: base.type,
                totalMissiles: base.missiles,
                side: sideLabel,
                rangeKm: base.rangeKm,
                lineRef: siloIcon,
                originalColor: siloColor
            };
            scene.add(hitSphere);
            items.push(hitSphere);
        }
    });
    return items;
}

function createStarOutline(outerRadius, innerRadius, color, points = 5) {
    const vertices = [];
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI * 2) / (points * 2) - Math.PI / 2;
        vertices.push(new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
    }
    vertices.push(vertices[0]);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: color }));
}

// ========== FUNCIÓN PRINCIPAL QUE INICIALIZA TODO ==========
export function initSilosAndCommands(scene, geoToVector3, alignToNorth) {
    // 1. Agregar silos de URSS y USA
    const siloItemsUSSR = addSilosFromData(scene, ussrSilosData, 0xcc5555, "ussr", geoToVector3, alignToNorth);
    const siloItemsUSA = addSilosFromData(scene, usaBasesData, 0xbcbcbc, "usa", geoToVector3, alignToNorth);
    const allSiloItems = [...siloItemsUSSR, ...siloItemsUSA];

    // 2. Centro de mando NORAD
    const noradPos = geoToVector3(-104.846, 38.742);
    const noradStar = createStarOutline(0.0035, 0.0015, 0xffcc66, 5);
    noradStar.position.copy(noradPos);
    alignToNorth(noradStar, noradPos, 38.742, -104.846);
    scene.add(noradStar);
    const noradHitSphere = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }));
    noradHitSphere.position.copy(noradPos);
    noradHitSphere.userData = {
        type: "commandCenter",
        name: "NORAD",
        lineRef: noradStar,
        originalColor: 0xffcc66
    };
    scene.add(noradHitSphere);
    const starGlowNorad = new THREE.PointLight(0xffaa55, 0.2, 0.4);
    starGlowNorad.position.copy(noradPos);
    scene.add(starGlowNorad);

    // 3. Centro de mando URSS (60 km al este de Moscú)
    const moscowLat = 55.7558;
    const moscowLon = 37.6173;
    const kmPerDegreeLon = 111.32 * Math.cos(moscowLat * Math.PI / 180);
    const deltaLon = 60 / kmPerDegreeLon;
    const ussrCmdLat = moscowLat;
    const ussrCmdLon = moscowLon + deltaLon;
    const ussrCmdPos = geoToVector3(ussrCmdLon, ussrCmdLat);
    const ussrStar = createStarOutline(0.0035, 0.0015, 0xffaa66, 5);
    ussrStar.position.copy(ussrCmdPos);
    alignToNorth(ussrStar, ussrCmdPos, ussrCmdLat, ussrCmdLon);
    scene.add(ussrStar);
    const ussrCmdHitSphere = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }));
    ussrCmdHitSphere.position.copy(ussrCmdPos);
    ussrCmdHitSphere.userData = {
        type: "commandCenter",
        name: "Centro de Mando URSS",
        lineRef: ussrStar,
        originalColor: 0xffaa66
    };
    scene.add(ussrCmdHitSphere);
    const starGlowUssr = new THREE.PointLight(0xffaa66, 0.2, 0.4);
    starGlowUssr.position.copy(ussrCmdPos);
    scene.add(starGlowUssr);

    // Devolver los objetos que pueden ser hovereados, junto con las luces por si se necesitan después
    const hoverableObjects = [...allSiloItems, noradHitSphere, ussrCmdHitSphere];
    return {
        hoverableObjects,
        starGlowNorad,
        starGlowUssr
    };
}
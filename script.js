const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // Camera
    // Parameters: name, alpha, beta, radius, target position, scene
    const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0.1, new BABYLON.Vector3(0, 0, 0), scene);
    // Positions the camera based on the example URL: -0.14,0.005,0.03
    // Babylon's ArcRotateCamera is defined by alpha, beta, radius, and target.
    // We'll set the position directly and then set the target.
    camera.setPosition(new BABYLON.Vector3(-0.14, 0.005, 0.03));
    camera.attachControl(canvas, true);

    // Enable auto-rotation
    camera.autoRotate = true;
    camera.autoRotateSpeed = 0.5; // Adjust speed as needed

    // Skybox
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/environments/studio.env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Model Loading
    BABYLON.SceneLoader.ImportMesh("", "", "HoodedCory_GoodNewHoodShiny_.FaceDark.glb", scene, function (meshes) {
        // Optional: scale or position the loaded model if necessary
        // meshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        // Ensure the camera is targeting the loaded model or a point of interest.
        // If meshes exist, set camera target to the first mesh's position.
        if (meshes.length > 0) {
            let mainMesh = meshes[0];
            mainMesh.scaling = new BABYLON.Vector3(2, 2, 2); // Scale by 200%

            // Ensure camera target is still relevant after scaling (it should be)
            let boundingInfo = mainMesh.getHierarchyBoundingVectors();
            let center = BABYLON.Vector3.Center(boundingInfo.min, boundingInfo.max);
            camera.setTarget(center);
        }
    });

    // Add a hemispheric light to ensure the model is visible
    // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.7;

    // Add a DirectionalLight
    // Light source is conceptually "slightly up, to the right, and slightly forward" from the model.
    // If model is at origin, source could be (5, 5, 5).
    // Direction of light rays is from source to target (model origin). So, (0-5, 0-5, 0-5) = (-5, -5, -5).
    const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1).normalize(), scene);
    directionalLight.intensity = 0.8; // Medium intensity
    directionalLight.diffuse = new BABYLON.Color3(1, 1, 1); // White light
    directionalLight.specular = new BABYLON.Color3(1, 1, 1); // White highlights
    // Set a conceptual position for the light source (e.g. for shadow maps if they were used)
    directionalLight.position = new BABYLON.Vector3(5, 5, 5);

    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});

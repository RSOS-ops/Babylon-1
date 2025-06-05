window.addEventListener('DOMContentLoaded', function(){
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    if (!engine) {
        console.error("Babylon engine could not be created.");
        return;
    }

    let textMesh;

    function positionAndScaleText(mesh, currentScene, cameraRef) {
        if (!mesh || !mesh.getScene() || !engine || !cameraRef) {
             console.warn("Text mesh, scene, engine or camera not available for scaling.");
             return;
        }

        mesh.scaling.x = 1;
        mesh.scaling.y = 1;
        mesh.scaling.z = 1;
        mesh.computeWorldMatrix(true);

        const boundingInfo = mesh.getBoundingInfo();
        const currentTextMeshWidth = (boundingInfo.maximum.x - boundingInfo.minimum.x);
        const currentTextMeshHeight = (boundingInfo.maximum.y - boundingInfo.minimum.y);

        if (currentTextMeshWidth === 0 || currentTextMeshHeight === 0) {
            console.warn("Text mesh dimensions are zero after reset. Font might not be loaded, text is empty, or an issue with CreateText. Applying default scale.");
            mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            mesh.position = BABYLON.Vector3.Zero();
            return;
        }

        const aspect = engine.getScreenAspectRatio ? engine.getScreenAspectRatio() : canvas.width / canvas.height;

        let frustumHeightAtText;
        let distanceToText = 10;
        if (cameraRef instanceof BABYLON.ArcRotateCamera) {
            distanceToText = cameraRef.radius;
        } else if (cameraRef instanceof BABYLON.FreeCamera) {
            distanceToText = BABYLON.Vector3.Distance(cameraRef.position, mesh.getAbsolutePosition());
        }

        if (cameraRef.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
            frustumHeightAtText = 2 * distanceToText * Math.tan(cameraRef.fov / 2);
        } else {
            frustumHeightAtText = cameraRef.orthoTop - cameraRef.orthoBottom;
        }
        const frustumWidthAtText = frustumHeightAtText * aspect;
        const desiredWorldWidth = frustumWidthAtText * 0.8; // 80%

        const scale = desiredWorldWidth / currentTextMeshWidth;

        mesh.scaling.x = scale;
        mesh.scaling.y = scale;
        mesh.scaling.z = scale;

        // Pivot has been centered, so positioning at origin is fine.
        mesh.position = BABYLON.Vector3.Zero();


        if (cameraRef instanceof BABYLON.ArcRotateCamera) {
            mesh.computeWorldMatrix(true); // Recompute after scaling and positioning
            const newBounds = mesh.getBoundingInfo();
            const finalScaledWidth = (newBounds.maximum.x - newBounds.minimum.x) * mesh.scaling.x;
            const finalScaledHeight = (newBounds.maximum.y - newBounds.minimum.y) * mesh.scaling.y;

            let radiusForHeight = (finalScaledHeight / 2) / Math.tan(cameraRef.fov / 2);
            let radiusForWidth = (finalScaledWidth / 2 / aspect) / Math.tan(cameraRef.fov / 2);

            cameraRef.radius = Math.max(radiusForHeight, radiusForWidth) * 1.25;
            cameraRef.target = BABYLON.Vector3.Zero();
        }
    }

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.8, 30, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        camera.upperBetaLimit = Math.PI / 2.05;
        camera.lowerRadiusLimit = 2;
        camera.wheelPrecision = 50;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.5, 1, 0.25), scene);
        light.intensity = 1.2;
        const light2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 0, -10), scene);
        light2.intensity = 0.5;
        light2.diffuse = new BABYLON.Color3(1,1,1); // White point light

        const FONT_NAME = "Roboto";
        const TEXT_TO_DISPLAY = "Cory Richard";

        try {
            textMesh = BABYLON.MeshBuilder.CreateText("textMesh", TEXT_TO_DISPLAY, null, {
                fontFamily: FONT_NAME,
                size: 10,
                resolution: 48,
                depth: 1,
                faceColors: [new BABYLON.Color4(1,1,1,1)],
            }, scene);

            if (textMesh) {
                const textMaterial = new BABYLON.StandardMaterial("textMaterial", scene);
                textMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
                textMaterial.emissiveColor = new BABYLON.Color3(0.08, 0.08, 0.08);
                textMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                textMesh.material = textMaterial;

                scene.executeWhenReady(() => {
                    if (textMesh && textMesh.getBoundingInfo()) {
                         const bounds = textMesh.getBoundingInfo();
                         const currentPivot = textMesh.getPivotPoint();
                         const centerAdjustment = bounds.boundingBox.center.subtract(currentPivot); // Adjust relative to current pivot
                         textMesh.setPivotPoint(centerAdjustment); // Set new pivot relative to current local origin
                         textMesh.computeWorldMatrix(true); // Recompute after pivot change
                         console.log("Text pivot centered using setPivotPoint.");
                    }

                    if (textMesh && scene.activeCamera) {
                        positionAndScaleText(textMesh, scene, camera);
                    } else {
                        console.error("Text mesh or camera not available for initial scaling post pivot adjustment.");
                    }
                });

            } else {
                console.error(`Failed to create text mesh for "${TEXT_TO_DISPLAY}" with font "${FONT_NAME}". Check font availability and browser console.`);
            }
        } catch (e) {
            console.error(`Error during text creation: ${e.message}`, e);
        }

        return scene;
    };

    const scene = createScene();

    if (!scene) {
        console.error("Scene could not be created.");
        return;
    }

    engine.runRenderLoop(function () {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    window.addEventListener('resize', function () {
        engine.resize();
        if (textMesh && scene && scene.activeCamera) {
             positionAndScaleText(textMesh, scene, scene.activeCamera);
        }
    });
});

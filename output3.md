| File | Line | Key/Text | Code |
|---|---|---|---|
| AcousticResonance | 366 | - | <button onClick={() => setIsPlayingAudio(!isPlayingAudio)} |
| AcousticResonance | 437 | - | <button onClick={() => setTubeType('closed')} |
| AcousticResonance | 445 | - | <button onClick={() => setTubeType('open')} |
| AcousticResonance | 460 | - | <button key={res.n} |
| AcousticResonance | 462 | - | onClick={() => { setHarmonicIndex(res.n); |
| AcousticResonance | 527 | - | <button onClick={handleLog} |
| AngledMirrors | 305 | - | <button onClick={handleLog} |
| AngledMirrors | 356 | - | <button key={p.angle} |
| AngledMirrors | 358 | - | onClick={() => setAngleDeg(p.angle)} className={`min-h-[44px] min-w-[44px] .. |
| AngledMirrors | 410 | - | type="checkbox" checked={showRays} |
| AngledMirrors | 419 | - | type="checkbox" checked={showImageCircle} |
| ArcLength | 364 | - | <button onClick={() => setIsRotating(!isRotating)} |
| ArcLength | 376 | - | <button onClick={() => { |
| ArcLength | 491 | "π/6 (30°)" | <button onClick={() => setPresetAngle(Math.PI / 6)} class="...">π/6 (30°)</.. |
| ArcLength | 492 | "π/4 (45°)" | <button onClick={() => setPresetAngle(Math.PI / 4)} class="...">π/4 (45°)</.. |
| ArcLength | 493 | "π/3 (60°)" | <button onClick={() => setPresetAngle(Math.PI / 3)} class="...">π/3 (60°)</.. |
| ArcLength | 494 | "π/2 (90°)" | <button onClick={() => setPresetAngle(Math.PI / 2)} class="...">π/2 (90°)</.. |
| ArcLength | 495 | "π (180°)" | <button onClick={() => setPresetAngle(Math.PI)} class="...">π (180°)</butto.. |
| ArcLength | 496 | "2π (360°)" | <button onClick={() => setPresetAngle(2 * Math.PI)} class="...">2π (360°)</.. |
| ArcLength | 521 | - | type="checkbox" checked={showUnrolled} |
| ArcLength | 531 | - | type="checkbox" checked={showVectors} |
| ArcLength | 541 | - | <button onClick={handleLog} |
| AtomicSpectra | 909 | - | <button id="btn-atomic-toggle-view" |
| AtomicSpectra | 911 | - | onClick={() => setActiveView((prev) => (prev === 'spectrometer' ? 'bohr_mod.. |
| AtomicSpectra | 924 | - | <button id="btn-atomic-run" |
| AtomicSpectra | 926 | - | onClick={() => setIsRunning((prev) => !prev)} |
| AtomicSpectra | 940 | - | <button id="btn-atomic-reset" |
| AtomicSpectra | 942 | - | onClick={handleReset} class="..." |
| AtomicSpectra | 1060 | - | <button id="btn-atomic-control-play-pause" |
| AtomicSpectra | 1062 | - | onClick={() => setIsRunning((prev) => !prev)} |
| AtomicSpectra | 1074 | - | <button id="btn-atomic-trigger-jump" |
| AtomicSpectra | 1076 | - | onClick={() => handleTriggerQuantumJump()} |
| AtomicSpectra | 1091 | - | <button onClick={() => setSpectrumMode('emission')} |
| AtomicSpectra | 1101 | - | <button onClick={() => setSpectrumMode('absorption')} |
| AtomicSpectra | 1120 | - | <button key={elem.id} |
| AtomicSpectra | 1122 | - | onClick={() => { setSelectedElementId(elem.id); |
| AtomicSpectra | 1162 | - | <button key={n} |
| AtomicSpectra | 1164 | - | onClick={() => handleTriggerQuantumJump(n)} |
| AtomicSpectra | 1187 | - | <button key={line.wavelength} |
| AtomicSpectra | 1189 | - | onClick={() => { setProbeWavelength(line.wavelength); |
| AtomicSpectra | 1233 | - | <button onClick={handleLog} |
| Bernoulli | 335 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Bernoulli | 341 | - | <button onClick={handleLog} |
| Bernoulli | 367 | - | <select value={selectedFluidIdx} |
| Bernoulli | 452 | - | type="checkbox" checked={showStreamlines} |
| Blackbody | 84 | - | <button id="blackbody-log-btn" |
| Blackbody | 86 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3 py-1.5 round.. |
| Blackbody | 96 | - | <button onClick={() => setTemperatureK(5800)} |
| Blackbody | 204 | - | <button onClick={() => setTemperatureK(9940)} |
| Blackbody | 212 | - | <button onClick={() => setTemperatureK(5800)} |
| Blackbody | 220 | - | <button onClick={() => setTemperatureK(3000)} |
| Blackbody | 228 | - | <button onClick={() => setTemperatureK(300)} |
| BuildAtom | 202 | - | <button id="model-orbits-btn" |
| BuildAtom | 205 | - | onClick={() => setModelType('orbits')} className={`min-h-[40px] px-3 py-1.5.. |
| BuildAtom | 216 | - | <button id="model-cloud-btn" |
| BuildAtom | 219 | - | onClick={() => setModelType('cloud')} className={`min-h-[40px] px-3 py-1.5 .. |
| BuildAtom | 233 | - | <button id="make-neutral-btn" |
| BuildAtom | 236 | - | onClick={handleNeutralize} className={`min-h-[44px] px-3 py-1.5 rounded-lg .. |
| BuildAtom | 249 | - | <button id="make-stable-btn" |
| BuildAtom | 252 | - | onClick={handleMakeStable} className={`min-h-[44px] px-3 py-1.5 rounded-lg .. |
| BuildAtom | 265 | - | <button id="log-measurement-btn" |
| BuildAtom | 268 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rou.. |
| BuildAtom | 280 | - | <button id="reset-atom-btn" |
| BuildAtom | 283 | - | onClick={handleReset} class="..." |
| BuildAtom | 308 | - | <button key={el.symbol} |
| BuildAtom | 312 | - | onClick={() => handleSelectElement(el)} className={`min-h-[42px] px-2.5 py-.. |
| BuildAtom | 582 | - | <button id="proton-decrement-btn" |
| BuildAtom | 585 | - | onClick={() => setProtons((prev) => Math.max(1, prev - 1))} |
| BuildAtom | 602 | - | <button id="proton-increment-btn" |
| BuildAtom | 605 | - | onClick={() => setProtons((prev) => Math.min(12, prev + 1))} |
| BuildAtom | 628 | - | <button id="neutron-decrement-btn" |
| BuildAtom | 631 | - | onClick={() => setNeutrons((prev) => Math.max(0, prev - 1))} |
| BuildAtom | 648 | - | <button id="neutron-increment-btn" |
| BuildAtom | 651 | - | onClick={() => setNeutrons((prev) => Math.min(16, prev + 1))} |
| BuildAtom | 674 | - | <button id="electron-decrement-btn" |
| BuildAtom | 677 | - | onClick={() => setElectrons((prev) => Math.max(0, prev - 1))} |
| BuildAtom | 694 | - | <button id="electron-increment-btn" |
| BuildAtom | 697 | - | onClick={() => setElectrons((prev) => Math.min(12, prev + 1))} |
| BuildNucleus | 333 | - | <button id="auto-balance-n-btn" |
| BuildNucleus | 336 | - | onClick={handleAutoBalanceN} className={`min-h-[44px] px-3 py-1.5 rounded-l.. |
| BuildNucleus | 349 | - | <button id="equal-nz-btn" |
| BuildNucleus | 352 | - | onClick={handleSetEqualNZ} className={`min-h-[44px] px-3 py-1.5 rounded-lg .. |
| BuildNucleus | 365 | - | <button id="log-measurement-btn" |
| BuildNucleus | 368 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rou.. |
| BuildNucleus | 380 | - | <button id="reset-nucleus-btn" |
| BuildNucleus | 383 | - | onClick={resetSimulation} class="..." |
| BuildNucleus | 416 | - | <button key={nuclide.symbol} |
| BuildNucleus | 420 | - | onClick={() => handleApplyPreset(nuclide)} |
| BuildNucleus | 673 | - | <button id="proton-decrement-btn" |
| BuildNucleus | 676 | - | onClick={() => setProtons((prev) => Math.max(1, prev - 1))} |
| BuildNucleus | 693 | - | <button id="proton-increment-btn" |
| BuildNucleus | 696 | - | onClick={() => setProtons((prev) => Math.min(92, prev + 1))} |
| BuildNucleus | 719 | - | <button id="neutron-decrement-btn" |
| BuildNucleus | 722 | - | onClick={() => setNeutrons((prev) => Math.max(0, prev - 1))} |
| BuildNucleus | 739 | - | <button id="neutron-increment-btn" |
| BuildNucleus | 742 | - | onClick={() => setNeutrons((prev) => Math.min(150, prev + 1))} |
| Buoyancy | 360 | - | <button onClick={handleLog} |
| Buoyancy | 420 | - | <select value={selectedMaterial} |
| Buoyancy | 436 | - | <select value={selectedFluid} |
| Buoyancy | 471 | - | type="checkbox" checked={autoFloatMode} |
| Calorimetry | 179 | - | <button onClick={() => setIsPlaying(!isPlaying)} |
| Calorimetry | 188 | - | <button onClick={handleReset} |
| Calorimetry | 194 | - | <button onClick={handleLog} |
| Calorimetry | 311 | - | <select value={solidIndex} |
| Calorimetry | 376 | - | <select value={liquidIndex} |
| Capacitor | 291 | - | <button id="capacitor-log-btn" |
| Capacitor | 293 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| Capacitor | 301 | - | <button id="capacitor-reset-btn" |
| Capacitor | 303 | - | onClick={resetSimulation} class="..." |
| Capacitor | 324 | t('standard') | <button onClick={() => applyPreset('standard')} |
| Capacitor | 330 | t('maxStorage') | <button onClick={() => applyPreset('maxStorage')} |
| Capacitor | 336 | t('disconnectDemo') | <button onClick={() => applyPreset('disconnectDemo')} |
| Capacitor | 342 | t('cameraFlash') | <button onClick={() => applyPreset('cameraFlash')} |
| Capacitor | 357 | - | <button id="btn-charge-battery" |
| Capacitor | 359 | - | onClick={() => handleSwitchMode('battery')} |
| Capacitor | 371 | - | <button id="btn-isolate-capacitor" |
| Capacitor | 373 | - | onClick={() => handleSwitchMode('disconnected')} |
| Capacitor | 385 | - | <button id="btn-discharge-bulb" |
| Capacitor | 387 | - | onClick={() => handleSwitchMode('bulb')} |
| Capacitor | 402 | - | <button id="btn-play-pause-discharge" |
| Capacitor | 404 | - | onClick={() => { if (circuitMode !== 'bulb') { |
| Capacitor | 431 | - | <button id="btn-instant-discharge" |
| Capacitor | 433 | - | onClick={handleInstantDischarge} class="..." |
| Capacitor | 684 | - | <button onClick={() => setBatteryVoltage(prev => Math.max(Number((prev - 0... |
| Capacitor | 699 | - | <button onClick={() => setBatteryVoltage(prev => Math.min(Number((prev + 0... |
| Capacitor | 707 | "-1.5V" | <button onClick={() => setBatteryVoltage(-1.5)} class="...">-1.5V</button> |
| Capacitor | 708 | "0.0V" | <button onClick={() => setBatteryVoltage(0.0)} class="...">0.0V</button> |
| Capacitor | 709 | "+1.5V" | <button onClick={() => setBatteryVoltage(1.5)} class="...">+1.5V</button> |
| Capacitor | 710 | "+3.0V" | <button onClick={() => setBatteryVoltage(3.0)} class="...">+3.0V</button> |
| Capacitor | 726 | - | <button onClick={() => setPlateArea_mm2(prev => Math.max(prev - 10, 100))} |
| Capacitor | 741 | - | <button onClick={() => setPlateArea_mm2(prev => Math.min(prev + 10, 400))} |
| Capacitor | 762 | - | <button onClick={() => setSeparation_mm(prev => Math.max(Number((prev - 0.5.. |
| Capacitor | 777 | - | <button onClick={() => setSeparation_mm(prev => Math.min(Number((prev + 0.5.. |
| Capacitor | 794 | - | <button key={mat.id} |
| Capacitor | 796 | - | onClick={() => setSelectedMaterialId(mat.id)} |
| Capacitor | 837 | - | <button onClick={() => setShowFieldLines(prev => !prev)} |
| Capacitor | 846 | - | <button onClick={() => setShowCharges(prev => !prev)} |
| Capacitor | 855 | - | <button onClick={() => setShowDipoles(prev => !prev)} |
| Capacitor | 864 | - | <button onClick={() => setShowVoltmeter(prev => !prev)} |
| CenterOfMass | 398 | - | <button onClick={() => { |
| CenterOfMass | 480 | - | <button onClick={() => setMode('particles')} |
| CenterOfMass | 488 | - | <button onClick={() => setMode('plumbline')} |
| CenterOfMass | 496 | - | <button onClick={() => setMode('balance')} |
| CenterOfMass | 510 | t('A') | <button onClick={() => setPivotPoint('A')} |
| CenterOfMass | 516 | t('B') | <button onClick={() => setPivotPoint('B')} |
| CenterOfMass | 522 | t('C') | <button onClick={() => setPivotPoint('C')} |
| CenterOfMass | 538 | - | <button onClick={handleAddMass} |
| CenterOfMass | 558 | - | <button onClick={() => handleRemoveMass(p.id)} |
| CenterOfMass | 586 | - | <button onClick={handleLog} |
| ChargesFields | 664 | - | <button id="charges-log-btn" |
| ChargesFields | 666 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| ChargesFields | 674 | - | <button id="charges-reset-btn" |
| ChargesFields | 676 | - | onClick={resetSimulation} class="..." |
| ChargesFields | 698 | t('dipole') | <button onClick={() => applyPreset('dipole')} |
| ChargesFields | 704 | t('likeCharges') | <button onClick={() => applyPreset('likeCharges')} |
| ChargesFields | 710 | t('quadrupole') | <button onClick={() => applyPreset('quadrupole')} |
| ChargesFields | 716 | t('singlePos') | <button onClick={() => applyPreset('singlePos')} |
| ChargesFields | 722 | t('parallel') | <button onClick={() => applyPreset('parallel')} |
| ChargesFields | 735 | - | <button id="btn-add-pos-charge" |
| ChargesFields | 737 | - | onClick={() => addCharge(1)} class="..." |
| ChargesFields | 745 | - | <button id="btn-add-neg-charge" |
| ChargesFields | 747 | - | onClick={() => addCharge(-1)} class="..." |
| ChargesFields | 755 | - | <button id="btn-trace-equipotential" |
| ChargesFields | 757 | - | onClick={traceEquipotentialAtSensor} class="..." |
| ChargesFields | 765 | - | <button id="btn-launch-test-particle" |
| ChargesFields | 767 | - | onClick={() => launchTestParticle(1)} class="..." |
| ChargesFields | 775 | - | <button id="btn-clear-all-charges" |
| ChargesFields | 777 | - | onClick={clearAllCharges} class="..." |
| ChargesFields | 860 | - | <button onClick={() => setShowVectors(prev => !prev)} |
| ChargesFields | 876 | - | <button onClick={() => setShowEquipotentials(prev => !prev)} |
| ChargesFields | 892 | - | <button onClick={() => setShowGrid(prev => !prev)} |
| ChargesFields | 909 | - | <button onClick={() => setEquipotentialLines([])} |
| ChargesFields | 950 | - | <button onClick={() => deleteCharge(c.id)} |
| Circuit | 1013 | - | <button id="btn-circuit-switch-toggle" |
| Circuit | 1015 | - | onClick={() => setIsSwitchClosed(!isSwitchClosed)} |
| Circuit | 1028 | - | <button id="btn-circuit-log-data" |
| Circuit | 1030 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| Circuit | 1042 | - | <button id="btn-circuit-reset" |
| Circuit | 1044 | t('common.reset') | onClick={handleResetCircuit} title={t('common.reset') II 'Reset'} |
| Circuit | 1062 | - | <button id="btn-topology-single" |
| Circuit | 1064 | - | onClick={() => setTopology('single')} className={`px-3 py-1.5 rounded-lg te.. |
| Circuit | 1074 | - | <button id="btn-topology-series2" |
| Circuit | 1076 | - | onClick={() => setTopology('series2')} className={`px-3 py-1.5 rounded-lg t.. |
| Circuit | 1086 | - | <button id="btn-topology-series3" |
| Circuit | 1088 | - | onClick={() => setTopology('series3')} className={`px-3 py-1.5 rounded-lg t.. |
| Circuit | 1098 | - | <button id="btn-topology-parallel2" |
| Circuit | 1100 | - | onClick={() => setTopology('parallel2')} |
| Circuit | 1110 | - | <button id="btn-topology-parallel3" |
| Circuit | 1112 | - | onClick={() => setTopology('parallel3')} |
| Circuit | 1122 | - | <button id="btn-topology-mixed" |
| Circuit | 1124 | - | onClick={() => setTopology('mixed')} className={`px-3 py-1.5 rounded-lg tex.. |
| Circuit | 1134 | - | <button id="btn-topology-lamp" |
| Circuit | 1136 | - | onClick={() => setTopology('lampCircuit')} |
| Circuit | 1152 | - | <button onClick={() => handlePresetVoltage(1.5)} |
| Circuit | 1158 | - | <button onClick={() => handlePresetVoltage(9.0)} |
| Circuit | 1164 | - | <button onClick={() => handlePresetVoltage(12.0)} |
| Circuit | 1170 | - | <button onClick={() => handlePresetVoltage(24.0)} |
| Circuit | 1197 | - | <button onClick={() => setSelectedProbe('all')} |
| Circuit | 1205 | - | <button onClick={() => setSelectedProbe('r1')} |
| Circuit | 1214 | - | <button onClick={() => setSelectedProbe('r2')} |
| Circuit | 1224 | - | <button onClick={() => setSelectedProbe('r3')} |
| Circuit | 1238 | - | <button onClick={() => setFlowType(flowType === 'electrons' ? 'conventional.. |
| Circuit | 1249 | - | type="checkbox" checked={showCurrentFlow} |
| Circuit | 1265 | - | onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove} |
| Collision | 360 | - | <button onClick={handleLog} |
| Collision | 384 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Collision | 396 | - | <button onClick={resetSimulation} |
| Collision | 405 | - | <button onClick={() => setRestitution(1.0)} |
| Collision | 413 | - | <button onClick={() => setRestitution(0.0)} |
| ColorVision | 221 | - | <button id="color-view-observer-btn" |
| ColorVision | 224 | - | onClick={() => setViewMode('observer')} className={`min-h-[38px] px-3 py-1 .. |
| ColorVision | 234 | - | <button id="color-view-spotlights-btn" |
| ColorVision | 237 | - | onClick={() => setViewMode('spotlights')} |
| ColorVision | 250 | - | <button id="color-copy-hex-btn" |
| ColorVision | 253 | - | onClick={handleCopyHex} class="..." |
| ColorVision | 262 | - | <button id="color-log-btn" |
| ColorVision | 265 | - | onClick={handleLog} className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-.. |
| ColorVision | 277 | - | <button id="color-reset-btn" |
| ColorVision | 280 | - | onClick={handleReset} class="..." |
| ColorVision | 306 | - | <button key={p.id} |
| ColorVision | 310 | - | onClick={() => handleApplyPreset(p)} className={`min-h-[38px] px-2.5 py-1 r.. |
| ColorVision | 349 | - | <button key={v.id} |
| ColorVision | 353 | - | onClick={() => setVisionMode(v.id as VisionDeficiency)} |
| ColorVision | 613 | - | <button id="red-power-toggle-btn" |
| ColorVision | 616 | - | onClick={() => setRedPower(!redPower)} className={`min-h-[32px] min-w-[32px.. |
| ColorVision | 636 | - | <button id="red-decrement-btn" |
| ColorVision | 639 | - | onClick={() => setRed((prev) => Math.max(0, prev - 5))} |
| ColorVision | 658 | - | <button id="red-increment-btn" |
| ColorVision | 661 | - | onClick={() => setRed((prev) => Math.min(255, prev + 5))} |
| ColorVision | 676 | - | <button id="green-power-toggle-btn" |
| ColorVision | 679 | - | onClick={() => setGreenPower(!greenPower)} |
| ColorVision | 699 | - | <button id="green-decrement-btn" |
| ColorVision | 702 | - | onClick={() => setGreen((prev) => Math.max(0, prev - 5))} |
| ColorVision | 721 | - | <button id="green-increment-btn" |
| ColorVision | 724 | - | onClick={() => setGreen((prev) => Math.min(255, prev + 5))} |
| ColorVision | 739 | - | <button id="blue-power-toggle-btn" |
| ColorVision | 742 | - | onClick={() => setBluePower(!bluePower)} |
| ColorVision | 762 | - | <button id="blue-decrement-btn" |
| ColorVision | 765 | - | onClick={() => setBlue((prev) => Math.max(0, prev - 5))} |
| ColorVision | 784 | - | <button id="blue-increment-btn" |
| ColorVision | 787 | - | onClick={() => setBlue((prev) => Math.min(255, prev + 5))} |
| CurvedMirrors | 311 | - | <button onClick={handleLog} |
| CurvedMirrors | 336 | - | <button onClick={() => setMirrorType('concave')} |
| CurvedMirrors | 346 | - | <button onClick={() => setMirrorType('convex')} |
| CurvedMirrors | 414 | - | type="checkbox" checked={showPrincipalRays} |
| Diffusion | 249 | - | <button id="diffusion-log-btn" |
| Diffusion | 251 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3 py-1.5 round.. |
| Diffusion | 261 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Diffusion | 268 | - | <button onClick={() => { |
| Diffusion | 303 | - | <button onClick={() => setBarrierOpen(!barrierOpen)} |
| DopplerEffect | 145 | - | <button onClick={() => setIsPlaying(!isPlaying)} |
| DopplerEffect | 154 | - | <button onClick={handleReset} |
| DopplerEffect | 160 | - | <button onClick={handleLog} |
| ElectricalTransformer | 102 | - | <button onClick={() => setIsPlaying(!isPlaying)} |
| ElectricalTransformer | 111 | - | <button onClick={handleLog} |
| Electromagnet | 739 | - | <button onClick={() => setIsCircuitClosed(!isCircuitClosed)} |
| Electromagnet | 751 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Electromagnet | 759 | - | <button onClick={resetSimulation} |
| Electromagnet | 767 | - | <button onClick={handleLog} |
| Electromagnet | 795 | - | <button onClick={() => setShowCompassGrid(!showCompassGrid)} |
| Electromagnet | 805 | - | <button onClick={() => setShowFieldLines(!showFieldLines)} |
| Electromagnet | 883 | - | <button onClick={() => setPowerMode('dc')} |
| Electromagnet | 895 | - | <button onClick={() => setPowerMode('ac')} |
| Electromagnet | 927 | - | <button onClick={() => setDcCurrent((prev) => -prev)} |
| ElectromagneticInduction | 819 | - | <button id="btn-faraday-play-pause" |
| ElectromagneticInduction | 821 | - | onClick={() => setIsRunning(!isRunning)} |
| ElectromagneticInduction | 842 | - | <button id="btn-faraday-flip-poles" |
| ElectromagneticInduction | 844 | - | onClick={() => setIsNorthLeading(!isNorthLeading)} |
| ElectromagneticInduction | 853 | - | <button id="btn-faraday-log-data" |
| ElectromagneticInduction | 855 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| ElectromagneticInduction | 867 | - | <button id="btn-faraday-reset" |
| ElectromagneticInduction | 869 | t('experiments.electromagnetic_induction.reset') | onClick={handleReset} title={t('experiments.electromagnetic_induction.reset.. |
| ElectromagneticInduction | 886 | - | <button id="btn-mode-oscillate" |
| ElectromagneticInduction | 888 | - | onClick={() => setMotionMode('oscillate')} |
| ElectromagneticInduction | 899 | - | <button id="btn-mode-manual" |
| ElectromagneticInduction | 901 | - | onClick={() => setMotionMode('manual')} className={`px-3 py-1.5 rounded-lg .. |
| ElectromagneticInduction | 912 | - | <button id="btn-mode-ac" |
| ElectromagneticInduction | 914 | - | onClick={() => setMotionMode('ac')} className={`px-3 py-1.5 rounded-lg text.. |
| ElectromagneticInduction | 930 | - | type="checkbox" checked={showFieldLines} |
| ElectromagneticInduction | 940 | - | type="checkbox" checked={showFluxVector} |
| ElectromagneticInduction | 1012 | - | <button onClick={() => setManualPosition(magnetPosRef.current - 60)} |
| ElectromagneticInduction | 1021 | - | <button onClick={() => setManualPosition(338)} |
| ElectromagneticInduction | 1030 | - | <button onClick={() => setManualPosition(magnetPosRef.current + 60)} |
| ElectromagneticInduction | 1039 | - | <button onClick={handleQuickThrust} |
| EnergySkatePark | 687 | - | <button id="energy-skate-play-pause-btn" |
| EnergySkatePark | 689 | - | onClick={() => setIsRunning(!isRunning)} |
| EnergySkatePark | 701 | - | <button onClick={() => setIsSlowMo(!isSlowMo)} |
| EnergySkatePark | 714 | - | <button id="energy-skate-park-log-btn" |
| EnergySkatePark | 716 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| EnergySkatePark | 728 | - | <button id="energy-skate-park-reset-btn" |
| EnergySkatePark | 730 | - | onClick={handleReset} title={tI18n('experiments.energy_skate_park.reset')} |
| EnergySkatePark | 749 | - | <button onClick={() => handleTrackChange('uRamp')} |
| EnergySkatePark | 759 | - | <button onClick={() => handleTrackChange('rollerCoaster')} |
| EnergySkatePark | 769 | - | <button onClick={() => handleTrackChange('skiSlope')} |
| EnergySkatePark | 790 | - | <button key={env.id} |
| EnergySkatePark | 792 | - | onClick={() => handleSelectEnv(env)} className={`px-2.5 py-1.5 rounded-lg t.. |
| EnergySkatePark | 966 | - | <button key={p.m} |
| EnergySkatePark | 968 | - | onClick={() => handleSkaterPreset(p.m)} className={`py-1 px-1.5 rounded-lg .. |
| EnergySkatePark | 1058 | - | type="checkbox" checked={showPieChart} |
| EnergySkatePark | 1068 | - | type="checkbox" checked={showBarGraph} |
| EnergySkatePark | 1078 | - | type="checkbox" checked={showSpeedometer} |
| EnergySkatePark | 1088 | - | type="checkbox" checked={showVectors} |
| ForcesMotion | 135 | - | <button onClick={() => setIsPlaying(!isPlaying)} |
| ForcesMotion | 144 | - | <button onClick={handleReset} |
| ForcesMotion | 150 | - | <button onClick={handleLog} |
| FourierWaves | 437 | - | <button id="fourier-play-pause-btn" |
| FourierWaves | 439 | - | onClick={() => setIsRunning(!isRunning)} |
| FourierWaves | 451 | - | <button onClick={() => setIsSlowMo(!isSlowMo)} |
| FourierWaves | 464 | - | <button id="fourier-audio-btn" |
| FourierWaves | 466 | - | onClick={() => setIsAudioPlaying(!isAudioPlaying)} |
| FourierWaves | 478 | - | <button id="fourier-log-btn" |
| FourierWaves | 480 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| FourierWaves | 492 | - | <button id="fourier-reset-btn" |
| FourierWaves | 494 | - | onClick={setSquareWave} title={tI18n('experiments.fourier_making_waves.rese.. |
| FourierWaves | 512 | - | <button onClick={setSquareWave} |
| FourierWaves | 523 | - | <button onClick={setSawtoothWave} |
| FourierWaves | 534 | - | <button onClick={setTriangleWave} |
| FourierWaves | 545 | - | <button onClick={setPureSine} |
| FourierWaves | 556 | - | <button onClick={setPulseTrain} |
| FourierWaves | 569 | - | <button onClick={clearAllHarmonics} |
| FourierWaves | 619 | - | type="checkbox" checked={showComponents} |
| FourierWaves | 629 | - | type="checkbox" checked={showSpectrum} |
| FourierWaves | 720 | - | onClick={() => updateHarmonic(idx, amp === 0 ? 0.5 : 0)} |
| FreeFall | 281 | - | <button key={p.id} |
| FreeFall | 283 | - | onClick={() => setGravity(p.g)} className={`min-h-[44px] min-w-[44px] px-2... |
| FreeFall | 314 | - | <button onClick={() => setIsVacuum(true)} |
| FreeFall | 323 | - | <button onClick={() => setIsVacuum(false)} |
| FreeFall | 335 | - | <button id="freefall-reset-btn" |
| FreeFall | 337 | - | onClick={handleReset} class="..."> |
| FreeFall | 342 | - | <button id="freefall-drop-btn" |
| FreeFall | 344 | - | onClick={handleStartDrop} disabled={isDropping} |
| FreeFall | 419 | - | <button id="log-freefall-btn" |
| FreeFall | 421 | - | onClick={handleLog} class="..."> |
| GravityForce | 486 | - | <button onClick={() => setIsRunning(!isRunning)} |
| GravityForce | 494 | - | <button onClick={handleReset} |
| GravityForce | 502 | - | <button onClick={handleLog} |
| GravityForce | 523 | - | <button key={preset.id} |
| GravityForce | 525 | - | onClick={() => applyPreset(preset, idx)} |
| GravityForce | 552 | - | <button onClick={() => setShowGravityWell(!showGravityWell)} |
| GravityForce | 562 | - | <button onClick={() => setShowRuler(!showRuler)} |
| GravityOrbits | 552 | - | <button id="gravity-orbits-log-btn" |
| GravityOrbits | 554 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| GravityOrbits | 566 | - | <button id="gravity-orbits-play-pause-btn" |
| GravityOrbits | 568 | - | onClick={() => setIsRunning(!isRunning)} |
| GravityOrbits | 580 | - | <button id="gravity-orbits-reset-btn" |
| GravityOrbits | 582 | - | onClick={handleReset} title={tI18n('experiments.gravity_and_orbits.reset')} |
| GravityOrbits | 604 | t('circular') | <button onClick={() => applyPreset('circular')} |
| GravityOrbits | 610 | t('elliptical') | <button onClick={() => applyPreset('elliptical')} |
| GravityOrbits | 616 | t('escape') | <button onClick={() => applyPreset('escape')} |
| GravityOrbits | 622 | t('heavyStar') | <button onClick={() => applyPreset('heavyStar')} |
| GravityOrbits | 628 | t('satellite') | <button onClick={() => applyPreset('satellite')} |
| GravityOrbits | 641 | - | <button id="btn-gravity-toggle" |
| GravityOrbits | 643 | - | onClick={() => setGravityOn(!gravityOn)} |
| GravityOrbits | 655 | - | <button id="btn-vectors-toggle" |
| GravityOrbits | 657 | - | onClick={() => setShowVectors(!showVectors)} |
| GravityOrbits | 669 | - | <button id="btn-clear-trail" |
| GravityOrbits | 671 | - | onClick={handleClearTrail} class="..." |
| GravityOrbits | 681 | - | <button key={spd} |
| GravityOrbits | 683 | - | onClick={() => setSimSpeed(spd)} className={`min-h-[36px] flex-1 text-xs fo.. |
| GravityOrbits | 836 | - | <button onClick={() => setShowGrid(prev => !prev)} |
| GravityOrbits | 852 | - | <button onClick={() => setShowVectors(prev => !prev)} |
| HeatConduction | 302 | - | <button onClick={() => setIsRunning(!isRunning)} |
| HeatConduction | 308 | - | <button onClick={handleReset} |
| HeatConduction | 314 | - | <button onClick={handleLog} |
| HeatConduction | 341 | - | <button key={mat} |
| HeatConduction | 343 | - | onClick={() => setMaterial(mat)} className={`min-h-[44px] min-w-[44px] px-2.. |
| KeplerLaws | 536 | - | <button id="kepler-play-pause-btn" |
| KeplerLaws | 538 | - | onClick={() => setIsRunning(!isRunning)} |
| KeplerLaws | 550 | - | <button id="kepler-laws-log-btn" |
| KeplerLaws | 552 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| KeplerLaws | 564 | - | <button id="kepler-laws-reset-btn" |
| KeplerLaws | 566 | - | onClick={handleReset} title={tI18n('experiments.keplers_laws.reset')} |
| KeplerLaws | 587 | - | <button key={p.id} |
| KeplerLaws | 589 | - | onClick={() => handleSelectPreset(p)} className={`px-2.5 py-1.5 rounded-lg .. |
| KeplerLaws | 610 | - | <button key={spd} |
| KeplerLaws | 612 | - | onClick={() => setSimSpeedMultiplier(spd)} |
| KeplerLaws | 799 | - | type="checkbox" checked={showSweptArea} |
| KeplerLaws | 809 | - | type="checkbox" checked={showFociAndAxes} |
| KeplerLaws | 819 | - | type="checkbox" checked={showVectors} |
| LightScattering | 324 | - | <button onClick={() => setIsRunning(!isRunning)} |
| LightScattering | 330 | - | <button onClick={handleLog} |
| LightScattering | 355 | - | <select value={selectedPresetIdx} |
| LightScattering | 400 | - | <button onClick={() => { |
| LightScattering | 413 | - | <button onClick={() => { |
| MagneticField | 971 | - | <button onClick={() => setMode('magnet_compass')} |
| MagneticField | 983 | - | <button onClick={() => setMode('solenoid')} |
| MagneticField | 995 | - | <button onClick={() => setMode('straight_wire')} |
| MagneticField | 1007 | - | <button onClick={() => setMode('force_wire')} |
| MagneticField | 1022 | - | <button onClick={() => setIsRunning((prev) => !prev)} |
| MagneticField | 1036 | - | <button onClick={handleReset} |
| MagneticField | 1044 | - | <button onClick={handleLog} |
| MagneticField | 1200 | - | <button onClick={() => setMagnetPolarity((prev) => (prev === 'NS' ? 'SN' : .. |
| MagneticField | 1233 | - | <button onClick={() => setIncludeEarthField(!includeEarthField)} |
| MagneticField | 1268 | - | <button onClick={() => setShowCompassGrid(!showCompassGrid)} |
| MagneticField | 1282 | - | <button onClick={() => setShowFieldLines(!showFieldLines)} |
| MagneticField | 1339 | - | <button key={mat} |
| MagneticField | 1341 | - | onClick={() => setCoreMaterial(mat)} className={`min-h-[44px] min-w-[44px] .. |
| MetricPrefixes | 152 | - | <button onClick={handleLog} |
| MetricPrefixes | 170 | - | <select value={selectedUnitIdx} |
| MetricPrefixes | 208 | - | <select value={fromPrefixIdx} |
| MetricPrefixes | 228 | - | <button onClick={handleSwap} |
| MetricPrefixes | 235 | - | <select value={toPrefixIdx} |
| MetricPrefixes | 264 | - | <button key={idx} |
| MetricPrefixes | 266 | - | onClick={() => { setInputValue(preset.val); |
| MetricPrefixes | 329 | - | onClick={() => setToPrefixIdx(idx)} className={`p-2.5 rounded-xl text-xs fl.. |
| MoleculesLight | 1000 | - | <button id="molecules-play-pause-btn" |
| MoleculesLight | 1003 | - | onClick={() => setIsEmitting(!isEmitting)} |
| MoleculesLight | 1012 | - | <button id="molecules-fire-single-btn" |
| MoleculesLight | 1015 | - | onClick={fireSinglePhoton} class="..." |
| MoleculesLight | 1024 | - | <button id="molecules-speed-toggle-btn" |
| MoleculesLight | 1027 | - | onClick={() => setSpeedMultiplier((prev) => (prev === 1.0 ? 0.4 : 1.0))} |
| MoleculesLight | 1041 | - | <button id="molecules-recombine-btn" |
| MoleculesLight | 1044 | - | onClick={handleRecombine} class="..." |
| MoleculesLight | 1054 | - | <button id="molecules-log-btn" |
| MoleculesLight | 1057 | - | onClick={handleLog} className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-.. |
| MoleculesLight | 1069 | - | <button id="molecules-reset-btn" |
| MoleculesLight | 1072 | - | onClick={handleReset} class="..." |
| MoleculesLight | 1099 | - | <button key={type} |
| MoleculesLight | 1103 | - | onClick={() => setLightType(type)} className={`min-h-[44px] px-3 py-2 round.. |
| MoleculesLight | 1143 | - | <button key={molKey} |
| MoleculesLight | 1147 | - | onClick={() => { setMolecule(molKey); |
| MoleculesLight | 1178 | - | <button id="molecules-mode-continuous-btn" |
| MoleculesLight | 1181 | - | onClick={() => setBeamMode('continuous')} |
| MoleculesLight | 1190 | - | <button id="molecules-mode-single-btn" |
| MoleculesLight | 1193 | - | onClick={() => setBeamMode('single')} className={`px-2.5 py-1 text-[11px] r.. |
| MoleculesLight | 1258 | - | <button id="molecules-clear-counters-btn" |
| MoleculesLight | 1261 | - | onClick={handleClearCounters} class="..." |
| MoleculesLight | 1301 | - | <button id="emission-decrement-btn" |
| MoleculesLight | 1304 | - | onClick={() => setEmissionRate((prev) => Math.max(1, prev - 1))} |
| MoleculesLight | 1322 | - | <button id="emission-increment-btn" |
| MoleculesLight | 1325 | - | onClick={() => setEmissionRate((prev) => Math.min(5, prev + 1))} |
| NormalModes | 97 | - | <button onClick={() => setIsPlaying(!isPlaying)} |
| NormalModes | 106 | - | <button onClick={handleLog} |
| NormalModes | 124 | - | <button key={mode} |
| NormalModes | 126 | - | onClick={() => setHarmonicMode(mode)} className={`min-h-[44px] min-w-[44px].. |
| Optics | 265 | - | <button onClick={() => setIsPrismMode(false)} |
| Optics | 274 | - | <button onClick={() => setIsPrismMode(true)} |
| Optics | 363 | - | <select id="select-medium1" |
| Optics | 380 | - | <select id="select-medium2" |
| Optics | 422 | - | <button key={c.col} |
| Optics | 424 | - | onClick={() => setLaserColor(c.col)} className={`min-h-[44px] min-w-[44px] .. |
| Optics | 437 | - | <button id="log-optics-btn" |
| Optics | 439 | - | onClick={handleLog} class="..."> |
| PendulumEnergy | 366 | - | <button onClick={() => setIsRunning(!isRunning)} |
| PendulumEnergy | 378 | - | <button onClick={resetSim} |
| PendulumEnergy | 519 | - | <select value={selectedPlanet} |
| PendulumEnergy | 533 | - | <button onClick={handleLog} |
| Pendulum | 399 | - | <button key={p.id} |
| Pendulum | 402 | - | onClick={() => setGravity(p.g)} className={`min-h-[44px] min-w-[44px] px-2... |
| Pendulum | 449 | - | type="checkbox" checked={showVectors} |
| Pendulum | 458 | - | type="checkbox" checked={showEnergyBars} |
| Pendulum | 469 | - | <button id="pendulum-play-toggle" |
| Pendulum | 471 | - | onClick={() => setIsRunning(!isRunning)} |
| Pendulum | 481 | - | <button id="pendulum-reset-btn" |
| Pendulum | 483 | - | onClick={resetSimulation} title={ctrl.reset} |
| Pendulum | 490 | - | <select value={simSpeed} |
| Pendulum | 679 | - | <button id="log-pendulum-btn" |
| Pendulum | 681 | - | onClick={handleLog} class="..."> |
| Periscope | 274 | - | <button onClick={handleLog} |
| Periscope | 350 | - | <button onClick={() => { |
| Periscope | 359 | - | <button onClick={() => { |
| PhotoelectricEffect | 693 | - | <button onClick={() => setIsRunning(!isRunning)} |
| PhotoelectricEffect | 701 | - | <button onClick={handleReset} |
| PhotoelectricEffect | 709 | - | <button onClick={handleLog} |
| PhotoelectricEffect | 725 | - | <select value={activeTab} |
| PhotoelectricEffect | 736 | - | <button onClick={() => setActiveTab('chamber')} |
| PhotoelectricEffect | 748 | - | <button onClick={() => setActiveTab('iv_curve')} |
| PhotoelectricEffect | 760 | - | <button onClick={() => setActiveTab('kf_curve')} |
| PhotoelectricEffect | 859 | - | <button key={m.id} |
| PhotoelectricEffect | 861 | - | onClick={() => setMetalIndex(idx)} className={`min-h-[42px] px-2.5 py-1.5 r.. |
| Polarization | 351 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Polarization | 357 | - | <button onClick={handleLog} |
| Polarization | 440 | - | <button key={i} |
| Polarization | 442 | - | onClick={() => { setPolarizer1AngleDeg(p.p1); |
| Polarization | 461 | - | type="checkbox" checked={useMiddlePolarizer} |
| PrescriptionGlasses | 289 | - | <button onClick={handleLog} |
| PrescriptionGlasses | 314 | - | <button onClick={() => { |
| PrescriptionGlasses | 328 | - | <button onClick={() => { |
| PrescriptionGlasses | 342 | - | <button onClick={() => { |
| PrescriptionGlasses | 400 | - | <button onClick={() => setGlassesEnabled(!glassesEnabled)} |
| Projectile | 379 | - | <button key={p.id} |
| Projectile | 381 | - | onClick={() => setGravity(p.g)} className={`min-h-[44px] min-w-[44px] px-2... |
| Projectile | 421 | - | type="checkbox" checked={isTargetMode} |
| Projectile | 432 | - | type="checkbox" checked={airDrag > 0} |
| Projectile | 443 | - | <button id="projectile-reset-btn" |
| Projectile | 445 | - | onClick={handleReset} class="..."> |
| Projectile | 450 | - | <button id="projectile-launch-btn" |
| Projectile | 452 | - | onClick={handleLaunch} disabled={isFlying} |
| Projectile | 577 | - | <button id="log-projectile-btn" |
| Projectile | 579 | - | onClick={handleLog} class="..."> |
| RadioactiveDecay | 516 | - | <button onClick={handleStepHalfLife} |
| RadioactiveDecay | 525 | - | <button onClick={() => setIsRunning(!isRunning)} |
| RadioactiveDecay | 533 | - | <button onClick={handleReset} |
| RadioactiveDecay | 541 | - | <button onClick={handleLog} |
| RadioactiveDecay | 562 | - | <button key={iso.id} |
| RadioactiveDecay | 564 | - | onClick={() => setIsotopeIndex(idx)} className={`min-h-[40px] px-3.5 py-1.5.. |
| RadioactiveDecay | 673 | - | <button key={spd} |
| RadioactiveDecay | 675 | - | onClick={() => setSpeedMultiplier(spd)} className={`min-h-[42px] px-3 py-1... |
| RampMachine | 241 | - | <button onClick={() => setIsRunning(!isRunning)} |
| RampMachine | 247 | - | <button onClick={handleLog} |
| RotationalDynamics | 426 | - | <button onClick={() => setIsRunning(!isRunning)} |
| RotationalDynamics | 438 | - | <button onClick={resetSim} |
| RotationalDynamics | 503 | - | <button onClick={() => setMode('pulley')} |
| RotationalDynamics | 513 | - | <button onClick={() => setMode('incline')} |
| RotationalDynamics | 529 | - | <button onClick={() => setGeometry('cylinder')} |
| RotationalDynamics | 539 | - | <button onClick={() => setGeometry('ring')} |
| RotationalDynamics | 549 | - | <button onClick={() => setGeometry('sphere')} |
| RotationalDynamics | 559 | - | <button onClick={() => setGeometry('rod_center')} |
| RotationalDynamics | 569 | - | <button onClick={() => setGeometry('rod_end')} |
| RotationalDynamics | 651 | - | <button onClick={handleLog} |
| RutherfordScattering | 564 | - | <button id="rutherford-play-pause-btn" |
| RutherfordScattering | 567 | - | onClick={() => setIsRunning(!isRunning)} |
| RutherfordScattering | 575 | - | <button id="rutherford-fire-single-btn" |
| RutherfordScattering | 578 | - | onClick={() => fireSingleParticle()} class="..." |
| RutherfordScattering | 587 | - | <button id="rutherford-head-on-btn" |
| RutherfordScattering | 590 | - | onClick={handleHeadOnShot} class="..." |
| RutherfordScattering | 599 | - | <button id="rutherford-clear-trails-btn" |
| RutherfordScattering | 602 | - | onClick={handleClearTrails} class="..." |
| RutherfordScattering | 611 | - | <button id="rutherford-log-btn" |
| RutherfordScattering | 614 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rou.. |
| RutherfordScattering | 626 | - | <button id="rutherford-reset-btn" |
| RutherfordScattering | 629 | - | onClick={handleReset} class="..." |
| RutherfordScattering | 654 | - | <button key={elem.z} |
| RutherfordScattering | 658 | - | onClick={() => setTargetZ(elem.z)} className={`min-h-[44px] px-3 py-2 round.. |
| RutherfordScattering | 686 | - | <button id="rutherford-mode-continuous-btn" |
| RutherfordScattering | 689 | - | onClick={() => setBeamMode('continuous')} |
| RutherfordScattering | 698 | - | <button id="rutherford-mode-single-btn" |
| RutherfordScattering | 701 | - | onClick={() => setBeamMode('single')} className={`px-2.5 py-1 text-[11px] r.. |
| RutherfordScattering | 775 | - | <button id="energy-decrement-btn" |
| RutherfordScattering | 778 | - | onClick={() => setEnergyMeV((prev) => Math.max(2.0, Math.round((prev - 0.5).. |
| RutherfordScattering | 796 | - | <button id="energy-increment-btn" |
| RutherfordScattering | 799 | - | onClick={() => setEnergyMeV((prev) => Math.min(10.0, Math.round((prev + 0.5.. |
| RutherfordScattering | 826 | - | <button id="impact-decrement-btn" |
| RutherfordScattering | 829 | - | onClick={() => setImpactParameter((prev) => Math.max(0, prev - 1))} |
| RutherfordScattering | 846 | - | <button id="impact-increment-btn" |
| RutherfordScattering | 849 | - | onClick={() => setImpactParameter((prev) => Math.min(50, prev + 1))} |
| RutherfordScattering | 862 | - | <button key={presetB} |
| RutherfordScattering | 866 | - | onClick={() => setImpactParameter(presetB)} |
| SeesawTorque | 222 | - | <button onClick={handleBalancePreset} |
| SeesawTorque | 228 | - | <button onClick={handleLog} |
| SledFriction | 271 | - | <button onClick={() => setIsRunning(!isRunning)} |
| SledFriction | 277 | - | <button onClick={handleReset} |
| SledFriction | 284 | - | <button onClick={handleLog} |
| SledFriction | 316 | - | <button key={st} |
| SledFriction | 318 | - | onClick={() => setSurface(st)} className={`px-2.5 py-2 rounded-xl text-xs f.. |
| SoundSpeed | 369 | - | <button onClick={strikeFork} |
| SoundSpeed | 439 | - | <button key={fork.f} |
| SoundSpeed | 441 | - | onClick={() => setSelectedFork(fork.f)} className={`p-2 rounded-xl text-cen.. |
| SoundSpeed | 458 | - | <button onClick={snapToL1} |
| SoundSpeed | 465 | - | <button onClick={snapToL2} |
| SoundSpeed | 510 | - | <button onClick={handleLog} |
| Spring | 479 | - | <button id="spring-log-btn" |
| Spring | 481 | - | onClick={handleLog} class="..." |
| Spring | 563 | - | <button id="spring-play-btn" |
| Spring | 565 | - | onClick={() => setIsRunning(!isRunning)} |
| Spring | 576 | - | <button id="spring-reset-btn" |
| Spring | 578 | - | onClick={resetSimulation} class="..." |
| Spring | 589 | - | type="checkbox" checked={showVectors} |
| Spring | 599 | - | type="checkbox" checked={showEnergyBars} |
| Spring | 691 | - | <button onClick={() => setOrientation('vertical')} |
| Spring | 701 | - | <button onClick={() => setOrientation('horizontal')} |
| StatesOfMatter | 214 | - | <button id="states-of-matter-log-btn" |
| StatesOfMatter | 216 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3 py-1.5 round.. |
| StatesOfMatter | 226 | - | <button onClick={setSolidPreset} |
| StatesOfMatter | 234 | - | <button onClick={setLiquidPreset} |
| StatesOfMatter | 242 | - | <button onClick={setGasPreset} |
| StatesOfMatter | 277 | - | <button onClick={() => { |
| StatesOfMatter | 288 | - | <button onClick={() => { |
| StatesOfMatter | 299 | - | <button onClick={() => { |
| StatesOfMatter | 332 | - | <button onClick={() => setTempK((prev) => Math.min(prev + 40, 600))} |
| StatesOfMatter | 338 | - | <button onClick={() => setTempK((prev) => Math.max(prev - 40, 5))} |
| StaticBalloons | 315 | - | <button onClick={handleLog} |
| StaticBalloons | 413 | - | <button onClick={() => { |
| StaticBalloons | 422 | - | <button onClick={() => { |
| StressStrain | 383 | - | <button onClick={handleLog} |
| StressStrain | 408 | - | <select value={selectedMatIdx} |
| StressStrain | 478 | - | <button onClick={() => setIsManualDeltaL(!isManualDeltaL)} |
| Thermodynamics | 407 | - | <button id="thermo-log-btn" |
| Thermodynamics | 409 | - | onClick={handleLog} class="..." |
| Thermodynamics | 439 | - | <button onMouseDown={(e) => { e.preventDefault(); setHeatingActive(true); }.. |
| Thermodynamics | 450 | - | <button onMouseDown={(e) => { e.preventDefault(); setCoolingActive(true); }.. |
| Thermodynamics | 461 | - | <button onClick={() => setIsRunning(!isRunning)} |
| Thermodynamics | 471 | - | <button onClick={resetSimulation} |
| Thermodynamics | 481 | - | <button onClick={() => setActiveProcess('isothermal')} |
| Thermodynamics | 489 | - | <button onClick={() => setActiveProcess('isobaric')} |
| Thermodynamics | 497 | - | <button onClick={() => setActiveProcess('isochoric')} |
| Thermodynamics | 505 | - | <button onClick={() => setActiveProcess('free')} |
| ThinLenses | 322 | - | <button onClick={handleLog} |
| ThinLenses | 348 | - | <button onClick={() => setLensType('convex')} |
| ThinLenses | 358 | - | <button onClick={() => setLensType('concave')} |
| ThinLenses | 426 | - | type="checkbox" checked={showPrincipalRays} |
| ViscosityStokes | 276 | - | <button onClick={() => setIsRunning(!isRunning)} |
| ViscosityStokes | 282 | - | <button onClick={handleReset} |
| ViscosityStokes | 289 | - | <button onClick={handleLog} |
| ViscosityStokes | 321 | - | <button key={liq} |
| ViscosityStokes | 323 | - | onClick={() => setLiquid(liq)} className={`px-2.5 py-2 rounded-xl text-xs f.. |
| ViscosityStokes | 344 | - | <button key={mat} |
| ViscosityStokes | 346 | - | onClick={() => setSphereMaterial(mat)} className={`px-2.5 py-2 rounded-xl t.. |
| WaveOnString | 527 | - | <button id="wave-string-play-pause-btn" |
| WaveOnString | 529 | - | onClick={() => setIsRunning(!isRunning)} |
| WaveOnString | 541 | - | <button onClick={() => setIsSlowMo(!isSlowMo)} |
| WaveOnString | 554 | - | <button id="wave-string-log-btn" |
| WaveOnString | 556 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| WaveOnString | 568 | - | <button id="wave-string-reset-btn" |
| WaveOnString | 570 | - | onClick={handleReset} title={tI18n('experiments.wave_on_a_string.reset')} |
| WaveOnString | 589 | - | <button onClick={() => setMode('oscillate')} |
| WaveOnString | 599 | - | <button onClick={() => setMode('pulse')} |
| WaveOnString | 609 | - | <button onClick={() => setMode('manual')} |
| WaveOnString | 622 | - | <button onClick={handleSendPulse} |
| WaveOnString | 638 | - | <button onClick={() => setEndType('fixed')} |
| WaveOnString | 648 | - | <button onClick={() => setEndType('loose')} |
| WaveOnString | 658 | - | <button onClick={() => setEndType('noEnd')} |
| WaveOnString | 809 | - | <button key={p.id} |
| WaveOnString | 811 | - | onClick={() => setTensionN(p.tensionN)} className={`py-1 px-1.5 rounded-lg .. |
| WaveOnString | 848 | - | <button key={d.id} |
| WaveOnString | 850 | - | onClick={() => setLinearDensity(d.mu_kg_m)} |
| WaveOnString | 892 | - | type="checkbox" checked={showRulers} |
| WaveOnString | 902 | - | type="checkbox" checked={showRefLines} |
| Waves | 223 | - | <button onClick={() => setSimMode('doubleSlit')} |
| Waves | 232 | - | <button onClick={() => setSimMode('rippleTank')} |
| Waves | 351 | - | <button id="log-waves-btn" |
| Waves | 353 | - | onClick={handleLog} class="..." |
| WireResistance | 461 | - | <button id="wire-circuit-switch-btn" |
| WireResistance | 463 | - | onClick={() => setIsCircuitClosed(!isCircuitClosed)} |
| WireResistance | 475 | - | <button id="wire-resistance-log-btn" |
| WireResistance | 477 | - | onClick={handleLog} className={`min-h-[44px] min-w-[44px] px-3.5 py-2 round.. |
| WireResistance | 489 | - | <button id="wire-resistance-reset-btn" |
| WireResistance | 491 | - | onClick={handleReset} title={tI18n('experiments.resistance_in_wire.reset')} |
| WireResistance | 512 | - | <button key={mat.id} |
| WireResistance | 514 | - | onClick={() => handleSelectMaterial(mat)} |
| WireResistance | 534 | t('powerCable') | <button onClick={() => handleApplicationPreset('powerCable')} |
| WireResistance | 540 | t('heater') | <button onClick={() => handleApplicationPreset('heater')} |
| WireResistance | 546 | t('filament') | <button onClick={() => handleApplicationPreset('filament')} |
| WireResistance | 552 | t('thinWire') | <button onClick={() => handleApplicationPreset('thinWire')} |
| WorkHeat | 312 | - | <button onClick={() => { |
| WorkHeat | 321 | - | <button onClick={handleLog} |
| WorkHeat | 496 | - | <button onClick={() => { |
| WorkHeat | 508 | - | <button onClick={() => { |
| RotationalDynamicsTorque | N/A | N/A | NOT FOUND |
| ModelsHAtom | N/A | N/A | NOT FOUND |
| CircuitConstructionKit | N/A | N/A | NOT FOUND |
| Generator | N/A | N/A | NOT FOUND |
| MagnetCompass | N/A | N/A | NOT FOUND |
| MagnetsElectromagnets | N/A | N/A | NOT FOUND |
| SolarSystem | N/A | N/A | NOT FOUND |
| EnergyForms | N/A | N/A | NOT FOUND |
| GasProperties | N/A | N/A | NOT FOUND |

Total row count: 647
Total file count actually scanned: 61

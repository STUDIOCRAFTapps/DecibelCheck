var alertSound;
var slider = document.getElementById("volume-slider");
var indicator = document.getElementById("volume-visualizer-indicator");
var volumeLimit = 85;

slider.oninput = function() {
  volumeLimit = this.value;
  indicator.style.left = volumeLimit + '%';
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }    
}

(function () {
    alertSound = new sound("alert2.wav");
    slider.value = volumeLimit;
    indicator.style.left = volumeLimit + '%';
})();

(async () => {
    let volumeCallback = null;
    let volumeInterval = null;
    const volumeVisualizer = document.getElementById('volume-visualizer-bar');

    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');

    // Initialize
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true
        }
      });
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      audioSource.connect(analyser);
      const volumes = new Uint8Array(analyser.frequencyBinCount);
      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;
        for(const volume of volumes)
          volumeSum += volume;
        const averageVolume = volumeSum / volumes.length;
        const percentVolume = averageVolume * 100 / 127
        // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
        if(percentVolume > volumeLimit) {
            alertSound.play();
            volumeVisualizer.style.setProperty('--bar-color', 'red');
        } else {
            volumeVisualizer.style.setProperty('--bar-color', '#b202ac');
        }

        volumeVisualizer.style.setProperty('--volume', (averageVolume * 100 / 127) + '%');
        
      };
    } catch(e) {
      console.error('Failed to initialize volume visualizer...', e);
    }
    // Use
    startButton.addEventListener('click', () => {
      // Updating every 100ms (should be same as CSS transition speed)
      if(volumeCallback !== null && volumeInterval === null)
        volumeInterval = setInterval(volumeCallback, 100);
    });
    stopButton.addEventListener('click', () => {
        volumeVisualizer.style.setProperty('--volume', '0%');
        if(volumeInterval !== null) {
            clearInterval(volumeInterval);
            volumeInterval = null;
        }
    });
})();
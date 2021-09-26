const canvas = document.querySelector('#imageCanvas');
const grayscaleCanvas = document.querySelector('#grayscaleCanvas');
const inversionCanvas = document.querySelector('#inversionCanvas');
const sepiaCanvas = document.querySelector('#sepiaCanvas');
const uploadPhoto = document.querySelector('#fileId');
const ctx = canvas.getContext('2d');
const ctx2 = grayscaleCanvas.getContext('2d');
const ctx3 = inversionCanvas.getContext('2d');
const ctx4 = sepiaCanvas.getContext('2d');

const getCombinigDefinition = document.querySelector('#combine');
const uploadBtn = document.querySelector('.btn--file');
const buttons = document.querySelectorAll('.filter--control-grid .filter--control-group');
const inputs = document.querySelectorAll('.filter--control-input');
const gradientInputA = document.querySelector('#head');
const gradientInputB = document.querySelector('#body');
const applyGradientBtn = document.querySelector('#applyGradient');
const rOffsetInput = document.getElementById("rOffset");
const gOffsetInput = document.getElementById("gOffset");
const bOffsetInput = document.getElementById("bOffset");
const resetButton = document.querySelector('#resetBtn');

let  isCombining = false;
let sourceImage;
const gradientValues = [];

const drawImageOnMainCanvas = (image) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.drawImage(image, 0, 0,  canvas.width, canvas.height);
    sourceImage = image;
}

const redrawImage = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.drawImage(sourceImage, 0, 0,  canvas.width, canvas.height);
  }

const truncateColor = (value) => {
    if(value < 0){
        value = 0
    }else if(value > 255){
        value = 255;
    }

    return value;
}

const colorInversion = (unit8Data) =>{
    for (let index = 0; index < unit8Data.length; index+= 4) {
        unit8Data[index] = unit8Data[index] ^ 255;
        unit8Data[index + 1] = unit8Data[index + 1] ^ 255;
        unit8Data[index + 2] = unit8Data[index + 2] ^ 255;
    }
}

const staticGrayScale = (data) => {
    for (let index = 0; index < data.length; index+= 4) {
        //const brightness = 0.34 * data[index] + 0.5 * data[index + 1] + 0.16 * data[index + 2]; // Static GrayScale Formula 1
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        data[index] = brightness;
        data[index + 1] = brightness;
        data[index + 2] = brightness;
    }
}


const applyBrightness = (data, brightnessValue) => {
    for (let index = 0; index < data.length; index+= 4) {
        data[index] += 255 * (brightnessValue / 100);
        data[index + 1] += 255 * (brightnessValue / 100);
        data[index + 2] += 255 * (brightnessValue / 100);
    }
}

const applyContrast = (data, contrast) => {
    const factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
    for (let index = 0; index < data.length; index+= 4) {
        data[index] = truncateColor(factor * (data[index] - 128.0) + 128.0);
        data[index + 1] = truncateColor(factor * (data[index + 1] - 128.0) + 128.0);
        data[index + 2] = truncateColor(factor * (data[index + 2] - 128.0) + 128.0);;
    }
}

const staticSepia = (data) => {
    for (let index = 0; index < data.length; index+= 4) {
        let red = data[index], green = data[index + 1], blue = data[index + 2];
        data[index] =  Math.min(Math.round(0.393 * red + 0.769 * green + 0.189 * blue), 255);;
        data[index + 1] =  Math.min(Math.round(0.349 * red + 0.686 * green + 0.168 * blue), 255);
        data[index + 2] = Math.min(Math.round(0.272 * red + 0.534 * green + 0.131 * blue), 255);
    }
}

const sepia = (data, value) => {
    for (let index = 0; index < data.length; index+= 4) {
        data[index] = 255 - value ;
        data[index + 1] =  255 - value;
        data[index + 2] = 255 - value;
    }
}

const saturation = (data,value) => {
    let max = (value < 0) ? 255 : 128;

    for (let index = 0; index < data.length; index+= 4) {
        let r = data[index] & 0xFF;
        let g = (data[index] >> 8) & 0xFF;
        let b = (data[index] >> 16) & 0xFF;
        let gray = (r * 0.2126 + g * 0.7152 + b * 0.0722);

        r += (r - gray) * value / max;
        g += (g - gray) * value / max;
        b += (b - gray) * value / max;

        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;

        data[index] =  (data[index] & 0xFF000000) | (b << 16) | (g << 8) | r;
    }
}

const createGradient = (colorA, colorB) => {   
    // Values of the gradient from colorA to colorB
    var gradient = [];
    // the maximum color value is 255
    var maxValue = 255;
    // Convert the hex color values to RGB object
    var from = getRGBColor(colorA);
    var to = getRGBColor(colorB);
    
    // Creates 256 colors from Color A to Color B
    for (var i = 0; i <= maxValue; i++) {
      // IntensityB will go from 0 to 255
      // IntensityA will go from 255 to 0
      // IntensityA will decrease intensity while instensityB will increase
      // What this means is that ColorA will start solid and slowly transform into ColorB
      // If you look at it in other way the transparency of color A will increase and the transparency of color B will decrease
      var intensityB = i;
      var intensityA = maxValue - intensityB;
      
      // The formula below combines the two color based on their intensity
      // (IntensityA * ColorA + IntensityB * ColorB) / maxValue
      gradient[i] = {
        r: (intensityA*from.r + intensityB*to.r) / maxValue,
        g: (intensityA*from.g + intensityB*to.g) / maxValue,
        b: (intensityA*from.b + intensityB*to.b) / maxValue
      };
    }
  
    return gradient;
  }

  // Helper function to convert 6digit hex values to a RGB color object
const getRGBColor = (hex) => {
  var colorValue;

  if (hex[0] === '#') {
    hex = hex.substr(1);
  }
  
  colorValue = parseInt(hex, 16);
  
  return {
    r: colorValue >> 16,
    g: (colorValue >> 8) & 255,
    b: colorValue & 255
  }
}


const drawSmallCanvases = (image) => {
    grayscaleCanvas.width = grayscaleCanvas.clientWidth;
    grayscaleCanvas.height = grayscaleCanvas.clientHeight;
    inversionCanvas.width = inversionCanvas.clientWidth;
    inversionCanvas.height = inversionCanvas.clientHeight;
    sepiaCanvas.width = sepiaCanvas.clientWidth;
    sepiaCanvas.height = sepiaCanvas.clientHeight;
    ctx2.drawImage(image, 0, 0,  grayscaleCanvas.width, grayscaleCanvas.height);
    ctx3.drawImage(image, 0, 0,  inversionCanvas.width, inversionCanvas.height);
    ctx4.drawImage(image, 0, 0,  sepiaCanvas.width, sepiaCanvas.height);
    
    const  imageData = ctx2.getImageData(0,0, grayscaleCanvas.width,grayscaleCanvas.height);
        staticGrayScale(imageData.data);
        ctx2.putImageData(imageData, 0, 0);
    
    const  imageData2 = ctx3.getImageData(0,0, inversionCanvas.width,inversionCanvas.height);
        colorInversion(imageData2.data);
        ctx3.putImageData(imageData2, 0, 0);
    
    const imageData3 = ctx4.getImageData(0,0, sepiaCanvas.width,sepiaCanvas.height);
        staticSepia(imageData3.data);
        ctx4.putImageData(imageData3, 0, 0);
    
}

const rgbSplit = (imageData, options) => {
    // destructure the offset values from options, default to 0
    const { rOffset = 0, gOffset = 0, bOffset = 0 } = options; 
    // clone the pixel array from original imageData
    const originalArray = imageData.data;
    const newArray = new Uint8ClampedArray(originalArray);
    // loop through every pixel and assign values to the offseted position
    for (let i = 0; i < originalArray.length; i += 4) {
      newArray[i + 0 + rOffset * 4] = originalArray[i + 0]; // 🔴
      newArray[i + 1 + gOffset * 4] = originalArray[i + 1]; // 🟢
      newArray[i + 2 + bOffset * 4] = originalArray[i + 2]; // 🔵
    }
    // return a new ImageData object
    return new ImageData(newArray, imageData.width, imageData.height);
}


const updateGlitchCanvas = () => {
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const updateImageData = rgbSplit(imageData, {
        rOffset: Number(rOffsetInput.value), 
        gOffset: Number(gOffsetInput.value),
        bOffset: Number(bOffsetInput.value)
    })
    ctx.putImageData(updateImageData, 0, 0);
}


//  Code Correct
const restoreGradientValues = ({name,value}) => {
    if(name === 'head') gradientValues[0] = value;
    if(name === 'body') gradientValues[1] = value;
}

buttons.forEach(btn =>{
    btn.addEventListener('click', e => {
        const target = e.currentTarget;
        let imageData;
        switch (target.dataset.type) {
            case 'inversion':
                !isCombining && redrawImage();
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                colorInversion(imageData.data);
                ctx.putImageData(imageData,0,0);

                // ctx.filter = `invert(${target.value}%)`;
                break;
            case 'grayscale':
                !isCombining && redrawImage();
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                staticGrayScale(imageData.data);
                ctx.putImageData(imageData,0,0);

                // ctx.filter = `grayscale(${target.value}%)`;
                break;
            case 'sepia':
                !isCombining && redrawImage();
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                staticSepia(imageData.data);
                ctx.putImageData(imageData,0,0);
            
                // ctx.filter = `grayscale(${target.value}%)`;
                 break;
            default:
                break;
        }
    });
});


inputs.forEach(btn =>{
    btn.addEventListener('change', e => {
        const target = e.currentTarget;
        let imageData;

        switch (target.name) {
            case 'contrast':
                !isCombining && redrawImage();
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                applyContrast(imageData.data, parseInt(target.value, 10));
                ctx.putImageData(imageData,0,0);

                // ctx.filter = `contrast(${target.value}%)`;
                break;
            case 'brightness':
                !isCombining &&  redrawImage();
                // ctx.drawImage(sourceImage, 0, 0,  canvas.width, canvas.height);
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                applyBrightness(imageData.data, parseInt(target.value, 10));
                ctx.putImageData(imageData,0,0);

                // ctx.filter = `brightness(${target.value}%)`;
                break;
            case 'saturation':
                !isCombining &&  redrawImage();
                imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
                saturation(imageData.data, parseInt(target.value, 10));
                ctx.putImageData(imageData,0,0);

                // ctx.filter = `saturation(${target.value}%)`;
                break;
            default:
                break;
        }

    });
});

rOffsetInput.addEventListener("input", updateGlitchCanvas);
gOffsetInput.addEventListener("input", updateGlitchCanvas);
bOffsetInput.addEventListener("input", updateGlitchCanvas);

uploadPhoto.addEventListener('change', e => {
    const getFile = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", function () {
        const res = reader.result;
        const offScreenImage = document.createElement('img');
        offScreenImage.src = res;
        offScreenImage.onload = function(){
            drawImageOnMainCanvas(offScreenImage);
            drawSmallCanvases(offScreenImage)
        }
      });

    reader.readAsDataURL(getFile);
    
});

const defaults = ["#e66465", "#f6b73c"];

applyGradientBtn.addEventListener('click', () => {
    const value = !!gradientValues.length ? gradientValues : defaults;
    console.log(gradientValues);
    const gradientColors = createGradient(...value);
    !isCombining && redrawImage();
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
        // Get the each channel color value
        const redValue = imageData.data[i];
        const greenValue = imageData.data[i+1];
        const blueValue = imageData.data[i+2];
      
        // Mapping the color values to the gradient index
        // Replacing the grayscale color value with a color for the duotone gradient
        imageData.data[i] = gradientColors[redValue].r;
        imageData.data[i+1] = gradientColors[greenValue].g;
        imageData.data[i+2] = gradientColors[blueValue].b;
        imageData.data[i+3] = 255;
      }
      ctx.putImageData(imageData,0,0);
});


gradientInputA.addEventListener('change', e => restoreGradientValues(e.target));
gradientInputB.addEventListener('change', e => restoreGradientValues(e.target));

uploadBtn.addEventListener('click', () => uploadPhoto.click());


getCombinigDefinition?.addEventListener('change', (e) => {
    isCombining = e.currentTarget.checked;
})

resetButton.addEventListener('click', redrawImage)
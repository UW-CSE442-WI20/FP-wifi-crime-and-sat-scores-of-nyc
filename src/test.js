// import * as fp from './fullpage/fullpage.js';
import fullpage from 'fullpage.js';
// import 'fullpage.js/vendors/scrolloverflow.js';
// import 'fullpage.js/dist/fullpage.js';

// const fp = require('./fullpage/fullpage.js');

console.log('hi')
new fullpage('#fullpage', {
  anchors: ['page1', 'page2', 'page3', 'page4'],
  sectionsColor: ['yellow', 'orange', '#C0C0C0', '#ADD8E6'],
});
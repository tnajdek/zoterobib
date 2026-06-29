import './wdyr';
import SmoothScroll from 'smooth-scroll';
import ZoteroBibComponent from './bib-component';

// required for Safari 10.1
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
// required for Safari <= 12.1
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js' // locale-data for en

const targetDom = document.getElementById('zotero-bib');

if(targetDom) {
	const config = JSON.parse(document.getElementById('zotero-bib-config').textContent);
	ZoteroBibComponent.init(targetDom, config);
} else {
	new SmoothScroll('main.faq a[href*="#"]', {offset: 16});
}

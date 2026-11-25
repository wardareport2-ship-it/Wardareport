import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../legacy-app.html', import.meta.url), 'utf8');
const smartStart = html.indexOf('/* ---------- Smart Retail Intelligence: movement-ledger analysis ---------- */');
const smartEnd = html.indexOf('function intelMoney(', smartStart);
const catalogStart = html.indexOf('function catalogSalesActivityIndex(');
const catalogEnd = html.indexOf('function renderCat()', catalogStart);
assert(smartStart >= 0 && smartEnd > smartStart, 'Smart Retail Intelligence block not found');
assert(catalogStart >= 0 && catalogEnd > catalogStart, 'Catalog ledger index not found');

const source = html.slice(smartStart, smartEnd) + '\n' + html.slice(catalogStart, catalogEnd);
const harness = `
const STORES = ['Warda','Amani','Afiya noor','Warda 2'];
const F = {store:'', slowDays:30};
let moves = [], STK = {}, TREE = [];
const today = () => '2026-11-20';
const dayStr = n => { const d = new Date('2026-11-20T12:00:00'); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
const mdate = x => x.date || '';
const vk = x => [x.sku||x.art||x.bc||(x.productId?'id:'+String(x.productId):''),x.color||'',x.size||''].join('|').toLowerCase();
const analyticsColor = x => x.color || 'Missing color';
const storeBillzPrices = (v,s) => v.billzPrices?.[s] || {};
const billzMoney = v => Number(v)||0;
${source}
const v1 = {k:'sku1|black|m',sku:'SKU1',name:'Fast Coat',color:'Black',size:'M',brand:'Test',loc:{'Warda':10,'Amani':1,'Afiya noor':0,'Warda 2':0},supply_price:100000,billzPrices:{'Warda':{supply:100000},'Amani':{supply:100000}}};
const v2 = {k:'sku2|brown|l',sku:'SKU2',name:'Slow Coat',color:'Brown',size:'L',brand:'Test',loc:{'Warda':3,'Amani':0,'Afiya noor':0,'Warda 2':0},supply_price:50000,billzPrices:{'Warda':{supply:50000}}};
STK[v1.k]=v1; STK[v2.k]=v2;
TREE=[{k:'sku1',name:'Fast Coat',sku:'SKU1',vars:[v1]},{k:'sku2',name:'Slow Coat',sku:'SKU2',vars:[v2]}];
moves=[
 {type:'out',from:'Amani',qty:9,date:'2026-11-18',sku:'SKU1',color:'Black',size:'M'},
 {type:'out',from:'Amani',qty:-2,date:'2026-11-19',sku:'SKU1',color:'Black',size:'M'},
 {type:'out',from:'Warda',qty:1,date:'2026-11-10',sku:'SKU1',color:'Black',size:'M'},
 {type:'out',from:'Warda',qty:1,date:'2026-10-01',sku:'SKU2',color:'Brown',size:'L'}
];
const all = smartRetailData(30,'');
const oneStore = smartRetailData(30,'Amani');
const productActivity = catalogSalesActivityIndex(TREE,30);
({all,oneStore,productActivity});
`;
const result = vm.runInNewContext(harness, {}, { timeout: 5000 });
const { all, oneStore, productActivity } = result;
assert.equal(all.stockValue, 1_250_000, 'Stock value should use available branch supply prices');
assert.equal(all.branches.find(x => x.store === 'Amani').gross, 9, 'Branch gross sales should be counted');
assert.equal(all.branches.find(x => x.store === 'Amani').returns, 2, 'Branch returns should be separated');
assert.equal(all.branches.find(x => x.store === 'Amani').net, 7, 'Branch net units should deduct returns');
assert(all.restock.some(x => x.from === 'Amani' && x.k === vKey('sku1','black','m')), 'Low-cover branch should trigger restock watch');
assert(all.transfers.some(x => x.from === 'Warda' && x.to === 'Amani'), 'Cross-branch transfer recommendation should be produced');
assert(all.slow.some(x => x.name === 'Slow Coat' && x.daysSince === 50), 'Last sale date should use all-time history, not only period sales');
assert.equal(oneStore.stockPieces, 1, 'Branch filter should scope current stock');
assert.equal(productActivity.get('sku2').soldInPeriod, 0, 'Catalog slow-moving filter should count no positive sales in selected period');
assert.equal(productActivity.get('sku2').daysSince, 50, 'Catalog should retain all-time last sale date');
console.log('Smart Retail Intelligence tests passed: returns, slow stock, restock, transfer, stock valuation, branch filter and all-time last-sale date.');

function vKey(sku,color,size){ return [sku,color,size].join('|'); }

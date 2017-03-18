

const relativePath = require('relative-path');
const libCrc = require('require-dir')('../lib', {camelcase: true});
const chai = require('chai');
const dirtyChai = require('dirty-chai');
const {expect} = chai;
const fs = require('fs');
const _ = require('lodash');
const CrcModelList = libCrc.crcModelList;
const codeFixturePath = './fixtures/es5-object-identification.js';

chai.use(dirtyChai);

describe('CrcModelLists group Identifiers by name. They', function () {
    let path, code, crcModelList;

    before(function () {
        path = relativePath(codeFixturePath);
        code = fs.readFileSync(path);
        crcModelList = new CrcModelList(code);
    });

    after(function () {
        crcModelList = null;
    });

    it('identify all declared Objects', function () {
        let modelCount = crcModelList.models.length;
        expect(modelCount).to.be.at.least(6);
    });

    it('can find an Identifier by name (by object literal or function predicate)', function () {
        let alpha = crcModelList.find({name: 'Alpha'});
        expect(alpha).to.exist();
        expect(alpha.name).to.equal('Alpha');

        expect(crcModelList.find(function (node) {
            return node.name === 'Bravo';
        })).to.exist();

        expect(crcModelList.find({name: 'foobar'})).not.to.exist();
    });

    it('track an object\'s usage by line numbers and range', function () {
        const alpha = crcModelList.find({name: 'Alpha'});
        const {range} = _.first(alpha.references);
        expect(_.first(range)).to.be.a('number');
        expect(_.last(range)).to.be.a('number');
    });

    it('associate collaborators with classes and objects', () =>   {
        let alpha, charlie, delta, echo, foxtrot;
        alpha = crcModelList.find({name: 'Alpha'});
        charlie = crcModelList.find({name: 'Charlie'});
        delta = crcModelList.find({name: 'Delta'});
        echo = crcModelList.find({name: 'Echo'});
        foxtrot = crcModelList.find({name: 'Foxtrot'});

        expect(_.find(delta.collaborators, {name: charlie.name})).to.exist();
        expect(_.find(echo.collaborators, {name: alpha.name})).to.exist();
        expect(_.find(foxtrot.collaborators, {name: alpha.name})).to.exist();
        expect(alpha.references.length).to.be.at.least(3);

    });

    specify('CRC models should not share arrays by reference', function () {
        let alpha, bravo;
        alpha = crcModelList.find({name: 'Alpha'});
        bravo = crcModelList.find({name: 'Bravo'});
        alpha.responsibilities.push('Aplha responsibility');
        expect(alpha.responsibilities.length).not.to.be.equal(bravo.responsibilities.length);
    });

    describe('can identify an object\'s prototype: when given reference to a CrcModel object', () => {

        let path, code, crcModelList, codeFixturePath, crc, prototype;

        before(() => {
            codeFixturePath = './fixtures/es5-object-prototypes.js';
            path = relativePath(codeFixturePath);
            code = fs.readFileSync(path);
            crcModelList = new CrcModelList(code);
        });

        after(() => {
            _.forEach(crcModelList.models, (m) => {
                let sn = m.superClass ? m.superClass.name : 'Object';
                console.log(`${m.name} is a prototype of ${sn}`);
            });
            crcModelList = null;
        });

        it('can identify its prototype with an Object.create expression statement', () => {
            crc = crcModelList.find({
                name: 'Employee'
            });
            proto = crcModelList.getPrototypeOf(crc);
            expect(proto.name).to.equal('Person');
            expect(crc.superClass.name).to.equal('Person');
        });

        it('can identify its prototype with class syntax and extends', () => {
            crc = crcModelList.find({name: 'Mime'});
            proto = crcModelList.getPrototypeOf(crc);
            expect(proto.name).to.equal('Person');
            expect(crc.superClass.name).to.equal('Person');
        });

        it('returns undefined if a prototype is not found', () => {
            crc = crcModelList.find({name: 'Person'});
            proto = crcModelList.getPrototypeOf(crc);
            expect(proto).to.be.undefined();

            crc = null;
            expect(crcModelList.getPrototypeOf(null)).to.be.undefined();
        });
    });

});

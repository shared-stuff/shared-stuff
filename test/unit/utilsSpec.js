/* jasmine specs for controllers go here */

describe('cleanObjectFromAngular', function () {
    beforeEach(function () {

    });

    it('should remove attributes starting with $$', function () {
        var items = [{'$$bla':1,"bla":2}]
        utils.cleanObjectFromAngular(items)
        expect(items[0]).toEqual({'bla':2})
    });
});


describe('search', function () {
    var search = utils.search;
    var items;

    beforeEach(function () {
        items = [ {
            id: 1,
            name:'Daemon',
            description: 'Great Book'
        },{
            name:'Good Fight Club',
            description: 'Great MovIe'
        },{
            name:'Bike 1',
            description: 'Good for little tours.'

        }
        ]
    });

    it('should find items by one search token', function () {
        expect(search(items,'Great')).toEqual([items[0],items[1]])
    });

    it('should find items by one search token case insensitive', function () {
        expect(search(items,'Movie')).toEqual([items[1]])
    });

    it('should find items which contain every search token (and)', function () {
        expect(search(items,'good tours')).toEqual([items[2]])
    });

    it('should search every attribute', function () {
        expect(search(items,'good')).toEqual([items[1],items[2]])
    });

    it('should search only strings', function () {
        expect(search(items,'1')).toEqual([items[2]])
    });

});
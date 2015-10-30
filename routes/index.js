var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var formidable = require('formidable');
var forms = new formidable.IncomingForm();
var path = require('path');
var join = path.join;
var fs = require('fs');
var data;
var colors;
var seasons;
var textures;
var containers;
forms.multiples = true;


var db = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'wangyuan0218',
	database: 'drawersandboxes'
	});


db.query(
	'CREATE TABLE IF NOT EXISTS clothes ('
	+ 'id INT(10) NOT NULL AUTO_INCREMENT, '
	+ 'clothesname VARCHAR(100) NULL, '
	+ 'clothestexture CHAR(20) NULL, '
	+ 'color CHAR(20) NULL, '
	+ 'season CHAR(20) NULL, '
	+ 'description LONGTEXT NULL, '
	+ 'filelocation VARCHAR(200) NOT NULL DEFAULT "error", '
	+ 'clothesowner CHAR(20) NOT NULL DEFAULT "Shan", '
	+ 'container VARCHAR(100) NOT NULL DEFAULT "NoContainer", '
	+ 'containerimg VARCHAR(100) NULL, '
	+ 'addedtime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, '
	+ 'PRIMARY KEY(id))',
	function (err) {
		if (err) throw err;
		console.log('Table created');
                refresh();
		}
	);

var refresh = function () {

        db.query( 'SELECT * FROM clothes',
	function (err, data1, next) {
		if (err) return next(err);

		data = data1;


		});
        db.query('SELECT clothestexture FROM clothes GROUP BY clothestexture',
                function (err, data2) {
                    if(err) return next(err);
                    textures = data2;

                });
        db.query('SELECT season FROM clothes GROUP BY season',
                function (err, data3) {
                    if(err) return next(err);
                    seasons = data3;

                });
        db.query('SELECT color FROM clothes GROUP BY color',
                function (err, data4) {
                    if(err) return next(err);
                    colors = data4;

                });
        db.query('SELECT container FROM clothes GROUP BY container',
                function (err, data5) {
                    if(err) return next(err);
                    containers = data5;

                });

                console.log('refreshed');
            };

refresh();

/* GET home page. */
/*router.download = function (dir) {
	return function (req, res, next) {
		var id = req.params.id;
		Photo.findById(id, function(err,photo) {
			if (err) return next(err);

			var path = join(dir, photo.path);
			res.sendfile(path);
			})
		};
	};


*/
router.get('/', function(req, res, next) {
        refresh();

        res.render('index', {
			  title: 'Clother Collection' ,
			  data: data,
                          colors: colors,
                          seasons: seasons,
                          containers: containers,
                          textures: textures
  });

});

router.post('/', function(req, res, next){
    console.log(req);
    if (req.body.season=='All') req.body.season='%' ;

    if (req.body.color=='All') req.body.color='%';
    if (req.body.texture=='All') req.body.texture='%';

    if (req.body.container=='All') req.body.container='%';

    console.log(req.body);
    db.query('SELECT * FROM clothes WHERE season LIKE ? AND '
            + 'color LIKE ? AND clothestexture LIKE ? AND container LIKE ? ',
            [req.body.season, req.body.color, req.body.texture, req.body.container], function (err, filtereddata, next){
                if (err) return next(err);

                res.render('index', {
                    title: 'Clother Collection' ,
                    data: filtereddata,
                    colors: colors,
                    seasons: seasons,
                    containers: containers,
                    textures: textures

                });

            });



});

router.get('/upload', function(req, res, next){
	res.render('upload', {title: 'Upload clothes photo'});
	});

router.post('/upload', function(req, res, next) {
	forms.parse(req, function(err, fields, files) {
console.log(req.body);
            if (err) return  next(err);



            if (!files.clothesimage.length) {
		var img = files.clothesimage;
		var img2 = files.containerimg;
		var name = fields.clothesname||img.name;
		var color = fields.clothescolor;
		var texture = fields.clothestexture;
		var season = fields.season;
		var description = fields.clothesdescription;
		var container = fields.container;
		var path = join(req.app.get('images'), img.name);
		var path2 = join(req.app.get('containerimages'), img2.name);


		fs.rename(img.path, path, function(err){

							if (err) return next(err);

							db.query('INSERT INTO clothes (clothesname, clothestexture, color, '
							+ 'season, description, filelocation, clothesowner, container, containerimg) '
							+ ' VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)',
							[name, texture, color, season, description, img.name, 'Shan', container, img2.name],
							function (err) {
								console.log('Single file accessed');
								if(err) return next(err);
								}

								);
					});
                fs.rename(img2.path, path2, function (err) {
					if (err) return next(err);

			});
		} else {
					var img;
					var img2;
					var path;
					var path2;

                    container = fields.container;
                        img2 = files.containerimg;
                    files.clothesimage.forEach(function(file) {
                      path = join(req.app.get('images'), file.name);

                        fs.rename(file.path, path, function(err){

							if (err) return next(err);

							db.query('INSERT INTO clothes (filelocation, clothesowner, container, containerimg) '
							+ ' VALUES (?, ?, ?, ?)',
							[file.name, 'Shan', container, img2.name],
							function (err) {
								console.log('multiple files accessed');
								if(err) return next(err);
								});
					});

                    });


                path2 = join(req.app.get('containerimages'), img2.name);
                fs.rename(img2.path, path2, function (err) {
					if (err) return next(err);

			});
                    }
                });


res.redirect('/');
        });

module.exports = router;

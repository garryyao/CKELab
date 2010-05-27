include('io');
include('ringo/webapp/response');

var log = require('ringo/logging').getLogger(module.id);

export('index', 'migrate' );

function index() {
    return skinResponse('./skins/welcome.html', {title: 'Welcome'});
}

function convertItem( item, type )
{
	var children = item[ type ],
			style,
			count;

	if( count = children.length() )
	{
		var plural = <{type.toLowerCase() + 's'} />;
		for ( var i = 0; i < count; i++ )
		{
			style = children[ i ];
			plural.@[ style.@name.toXMLString().replace( /\-/g, '_dash_' ) ]
					= style.@value.toXMLString();
			delete children[ count--, i-- ];
		}
		item.* += plural;
	}
}

function convertStyles( xml )
{
	var items = [ item for each ( item in xml[ 'Style'] ) ];
	return items.map( function ( item )
	{
		convertItem( item, 'Style' );
		convertItem( item, 'Attribute' );
		item = require( 'xml2json' ).parser( item.toXMLString() ).style;
		return item;
	} );
}

function postProcess( json )
{
	return json.replace( /_dash_/g, '-' );
}

var templates =
{
	'styles' : 'CKEDITOR.stylesSet.add( \'default\', ${list});'
};

function convert( content, type )
{
	// Remove xml declarition and unfortunately, all comments.
	content = content.replace( /\s*<(?:\?|!--)[\s\S]*?(?:\?|--)>\s*/g, '' );
	var xml = new XML( content );
	var template = templates[ type ],
			json = this[ ( 'convert-' + type ).toCamelCase() ]( xml );

	return template.replace( '${list}', postProcess( JSON.stringify( json ) ) );
}

function migrate(req)
{
    if (req.isPost && req.params.file) {
		var ts = new TextStream( MemoryStream( req.params.file.value ), 'utf-8' );
		var result = require( 'jsbeautify').beautify( convert( ts.read(), req.params.type ), { braces_on_own_line : true, keep_array_indentation: false } );
		log.info( 'convertion of type: ' + req.params.type + ' results in: ' + result );
        return {
            status: 200,
            headers: { "Content-Type": "application/json", "Content-Disposition" : "attachment;filename=default.js" },
            body: [result]
        };
    }
    return skinResponse('./skins/migrate.html', {
        title: "Migration Tool"
    });
}

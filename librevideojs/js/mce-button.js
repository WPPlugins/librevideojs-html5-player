/*!
 * @source: here
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyleft 2016 Jorge Maldonado Ventura
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
/**
 *
 */
(function() {
    tinymce.PluginManager.add('librevideojs', function(editor, url) {
        var sh_tag = 'librevideojs_video';

        //add popup
        editor.addCommand('librevideojs_popup', function(ui, v) {
            //setup defaults
            var url = '';
            if (v.url)
                url = v.url;
            var poster = '';
            if (v.poster)
                poster = v.poster;
            var code = 'webm';
            if (v.code)
                code = v.code;
            var color = 'mixteal';
            if (v.color)
                code = v.color;
            var content = '';
            if (v.content)
                content = v.content;

            editor.windowManager.open( {
                title: 'LibreVideoJS - Inserción de vídeo',
                body: [
                    {
                        type: 'textbox',
                        name: 'url',
                        label: 'URL',
                        value: url,
                        tooltip: 'Inserta la URL del vídeo'
                    },
                    {
                        type: 'textbox',
                        name: 'poster',
                        label: 'Poster',
                        value: poster,
                        tooltip: 'Escribe aquí la URL de la imagen que deseas que se visualice antes de reproducir el vídeo'
                    },
                    {
                        type: 'listbox',
                        name: 'code',
                        label: 'Formato',
                        value: code,
                        'values': [
                            {text: 'webm', value: 'webm'},
                            {text: 'ogv', value: 'ogg'},
                            {text: 'mp4', value: 'mp4'}
                        ],
                        tooltip: 'Selecciona el formato del vídeo'
                    },
                    {
                        type: 'listbox',
                        name: 'color',
                        label: 'Piel',
                        value: color,
                        'values': [
                            {text: 'mixblue', value: 'mixblue'},
                            {text: 'mixgrey', value: 'mixgrey'},
                            {text: 'mixpurple', value: 'mixpurple'},
                            {text: 'mixred', value: 'mixred'},
                            {text: 'mixteal', value: 'mixteal'},
                            {text: 'mixyellow', value: 'mixyellow'},
                            {text: 'materialblue', value: 'materialblue'},
                            {text: 'materialgrey', value: 'materialgrey'},
                            {text: 'materialpurple', value: 'materialpurple'},
                            {text: 'materialred', value: 'materialred'},
                            {text: 'materialteal', value: 'materialteal'},
                            {text: 'materialyellow', value: 'materialyellow'},
                        ],
                        tooltip: 'Selecciona el color'
                    },
                    {
                        type: 'textbox',
                        name: 'content',
                        label: 'Extra',
                        value: content,
                        multiline: true,
                        minWidth: 300,
                        minHeight: 100
                    }
                ],
                onsubmit: function(e) {
                    var shortcode_str = '[' + sh_tag;
                    if (typeof e.data.url != 'undefined' && e.data.url.length)
                        shortcode_str += ' url="' + e.data.url + '"';
                    if (typeof e.data.poster != 'undefined' && e.data.poster.length)
                        shortcode_str += ' poster="' + e.data.poster + '"';
                    if (typeof e.data.code != 'undefined' && e.data.code.length)
                        shortcode_str += ' code="' + e.data.code + '"';
                    if (typeof e.data.color != 'undefined' && e.data.color.length)
                        shortcode_str += ' skin="' + e.data.color + '"';

                    //add panel content
                    shortcode_str += ']' + e.data.content + '[/' + sh_tag  + ']';
                    //insert shortcode to tinymce
                    editor.insertContent(shortcode_str);
                }
            });
        });

        editor.addButton('librevideojs', {
            icon: 'librevideojs',
            tooltip: 'LibreVideoJS',
            onclick: function() {
                editor.execCommand('librevideojs_popup', '', {
                    url : '',
                    poster: '',
                    code: 'webm',
                    color: '',
                    content: '',
                });
            }
        });
    });
})();

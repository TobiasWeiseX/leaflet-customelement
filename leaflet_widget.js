
class LeafletElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.content_div = document.createElement('div');
        this.shadowRoot.appendChild(this.content_div);

        this.link = document.createElement('link');
        this.link.setAttribute("rel", "stylesheet");
        this.link.setAttribute("href", "http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css");
        this.shadowRoot.appendChild(this.link);

        //this.script = document.createElement('script');
        //this.script.setAttribute("src", "http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js");
        //this.shadowRoot.appendChild(this.script);

        //<link rel = "stylesheet" href = "http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css"/>
        //<script src = "http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js"></script>


        this.slot_ele = document.createElement('slot');
        this.shadowRoot.appendChild(this.slot_ele);
        this.dot_text = "";
    }

    connectedCallback(){
        let zoom = this.hasAttribute('zoom') ? this.getAttribute('zoom') : "11";
        let style = this.hasAttribute('style') ? this.getAttribute('style') : "";
        this.content_div.style = style;

        async function search(name){
            //let results = localStorage.getItem("https://nominatim.openstreetmap.org/search.php?q="+name+"&polygon_geojson=1&format=json");
            //if(results){
            //    console.log("Use cache!");
            //    return JSON.parse(results);
            //}
            //else{
            //console.log("Use fetch!");
            let resp = await fetch("https://nominatim.openstreetmap.org/search.php?q="+name+"&polygon_geojson=1&format=json");

            //what if negative resp?
            //console.log(resp);

            let results = await resp.json();
            //console.log(results);

            //localStorage.setItem("https://nominatim.openstreetmap.org/search.php?q="+name+"&polygon_geojson=1&format=json", JSON.stringify(results));
            return results;
            //}
        }
        
        function right_result(result){
            return result.osm_type === "relation";
        }

        async function get_polygon(name){
            let query = "https://nominatim.openstreetmap.org/search.php?q="+name+"&polygon_geojson=1&format=json";
            let result = localStorage.getItem(query);
            if(result){
                console.log("Use cache!");
                return JSON.parse(result);
            }
            else{
                console.log("Use fetch!");
                let results = await search(name);
                let result = results.filter(right_result)[0];
                console.log(result);
                localStorage.setItem(query, JSON.stringify(result));
                return result;
            }
        }

        let that = this;
        this.slot_ele.addEventListener('slotchange', async e => {
            let spec = JSON.parse(that.innerText);

            //alert(JSON.stringify(spec));

            let polygons = {};
            for(let k of Object.keys(spec.areas)){
                //let results = await search(k);
                //let result = results.filter(right_result)[0];
        
                let result = await get_polygon(k);

                //alert(typeof result);

                polygons[k] = result;
            }
        
            //alert(JSON.stringify(polygons));

            let mapOptions = {
                //center: [52.6787254, 13.5881114],
                //center: [Number(result.lat), Number(result.lon)],
                center: [Number(polygons[spec.focus].lat), Number(polygons[spec.focus].lon)],
                zoom
            };
        
            //let map = new L.map('map', mapOptions);
            let map = new L.map(this.content_div, mapOptions);

            let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            map.addLayer(layer);
            
            function switch_coords(poly){
                return poly.map(t => [t[1], t[0]]);
            }
        
            for(let k of Object.keys(polygons)){
                let result = polygons[k];
        
                let latlang;
                switch(result.geojson.type){
                    case "MultiPolygon":
                        latlang = [
                            ...result.geojson.coordinates[0].map(x => switch_coords(x))
                        ];
                        break;
        
                    case "Polygon":
                        latlang = [
                            ...[ switch_coords(result.geojson.coordinates[0]) ]
                        ];
                        break;
                }
        
                let multiPolygonOptions = {color: spec.areas[k], weight:2};
                let multipolygon = L.multiPolygon(latlang , multiPolygonOptions);
                multipolygon.addTo(map);
            }
            this.slot_ele.style.display = "none";
            this.content_div.children[0].setAttribute("width", this.content_div.style.width);
            this.content_div.children[0].setAttribute("height", this.content_div.style.height);
        });
    }

    disconnectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        //this.displayVal.innerText = this.value;
    }

    get layout(){

    }

    set layout(x){

    }

    get value(){
        //dot code
    }

    set value(x){

    }

}

customElements.define('leaf-let', LeafletElement);


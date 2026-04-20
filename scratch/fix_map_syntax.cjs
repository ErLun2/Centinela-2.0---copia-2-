const fs = require('fs');
const path = 'src/pages/CompanyDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic block in the modal
const brokenSnippet = `                           <MapContainer 
                              center={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} 
                              zoom={18} 
                                             <Marker position={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} icon={guardIcon} />
                            </MapContainer>`;

// I'll try to find it with a more robust regex or exact search if possible
// Let's use a simpler approach: finding the start of the MapContainer and the next </MapContainer>

const startTag = '<MapContainer';
const endTag = '</MapContainer>';

const startIndex = content.indexOf(startTag, content.indexOf('Visor Multimedia')); 
const endIndex = content.indexOf(endTag, startIndex) + endTag.length;

if (startIndex > -1 && endIndex > -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const fixedSnippet = `<MapContainer 
                              center={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} 
                              zoom={18} 
                              style={{ height: '100%', width: '100%' }}
                              zoomControl={false}
                           >
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} icon={guardIcon} />
                           </MapContainer>`;
                           
    fs.writeFileSync(path, head + fixedSnippet + tail);
    console.log('Successfully repaired MapContainer structure');
} else {
    console.log('Could not find MapContainer in the expected area');
}

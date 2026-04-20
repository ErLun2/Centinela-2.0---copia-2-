        {/* MODAL GESTIÓN DE EVENTO / MULTIMEDIA (Popout) */}
        {mediaModal.show && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
              <div className="glass fade-up" style={{ width: '900px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '0', borderRadius: '32px', border: '1px solid rgba(0,168,255,0.3)', overflow: 'hidden' }}>
                 {/* Lado Izquierdo: Evidencia Visual y Geográfica */}
                 <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)', fontSize: '1rem' }}>Evidencia del Evento</h3>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                             {mediaModal.event?.tipo?.toUpperCase() || 'NOTIFICACIÓN'} • {mediaModal.event?.hora} • {mediaModal.event?.fechaRegistro?.split('T')[0]}
                          </div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                       {/* Área de Mapa (Siempre visible) */}
                       <div className="glass" style={{ height: '320px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,168,255,0.2)', position: 'relative' }}>
                          <MapContainer 
                             key={`map-${mediaModal.event?.lat || mediaModal.event?.latitude}-${mediaModal.event?.lng || mediaModal.event?.longitude}-${mediaModal.event?.id}`}
                             center={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} 
                             zoom={18} 
                             style={{ height: '100%', width: '100%' }}
                             zoomControl={false}
                          >
                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                             <Marker 
                                position={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} 
                                icon={guardIcon} 
                             />
                             <RecenterMap pos={[(mediaModal.event?.lat || mediaModal.event?.latitude || -34.6037), (mediaModal.event?.lng || mediaModal.event?.longitude || -58.3816)]} />
                          </MapContainer>
                          <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.8)', padding: '8px 15px', borderRadius: '10px', zIndex: 1000, fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid var(--primary)' }}>
                             UBICACIÓN DE ENVÍO
                          </div>
                       </div>

                       {/* Área de Multimedia (Scroll Horizontal) */}
                       <div style={{ 
                          background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', 
                          padding: '20px', display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '15px', scrollbarWidth: 'thin'
                       }}>
                          {(mediaModal.event?.hasMedia || mediaModal.content || mediaModal.event?.foto || mediaModal.event?.video || mediaModal.event?.audio) ? (
                             <>
                                {(mediaModal.type === 'image' || mediaModal.event?.foto) && (
                                   <div style={{ minWidth: '400px', height: '240px', background: 'rgba(0,0,0,0.5)', borderRadius: '15px', overflow: 'hidden' }}>
                                      <img src={mediaModal.content || mediaModal.event?.foto || 'https://images.unsplash.com/photo-1590044591235-0750279191e7?w=800'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   </div>
                                )}
                                {(mediaModal.type === 'video' || mediaModal.event?.video) && (
                                   <div style={{ minWidth: '300px', height: '240px', background: '#000', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <Play size={50} color="var(--primary)" />
                                      <span style={{ fontSize: '0.8rem', marginTop: '10px' }}>VIDEO REGISTRADO</span>
                                   </div>
                                )}
                                {(mediaModal.type === 'audio' || mediaModal.event?.audio) && (
                                   <div style={{ minWidth: '300px', height: '150px', background: 'rgba(0,168,255,0.1)', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <Volume2 size={40} color="var(--primary)" />
                                      <span style={{ fontSize: '0.8rem', marginTop: '10px' }}>NOTA DE VOZ</span>
                                   </div>
                                )}
                                {/* Espaciador/Filler para mostrar que es un carrete */}
                                <div style={{ minWidth: '200px', height: '240px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                   <FileText size={30} opacity={0.3} />
                                   <span style={{ fontSize: '0.65rem', marginTop: '10px', opacity: 0.3 }}>REFERENCIA: {mediaModal.event?.id}</span>
                                </div>
                             </>
                          ) : (
                             <div style={{ width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                <FileText size={40} />
                                <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>Evento Informativo - Solo Texto</p>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', marginTop: '10px', width: '100%', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                                   {mediaModal.event?.mensaje || mediaModal.event?.descripcion || 'Sin descripción adicional.'}
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Lado Derecho: Gestión y Resolución */}
                 <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                       <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>GUARDIA INFORMANTE</label>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '15px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <User size={20} color="white" />
                          </div>
                          <div>
                             <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{companyUsers.find(u => (u.id === mediaModal.event?.usuario || u.uid === mediaModal.event?.usuario))?.nombre || 'Guardia Notificador'}</div>
                             <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>ID: {mediaModal.event?.usuario?.substring(0,8)}...</div>
                          </div>
                       </div>
                    </div>

                    <div>
                       <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>DETALLE DEL EVENTO</label>
                       <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '15px' }}>
                          {mediaModal.event?.mensaje || mediaModal.event?.descripcion || 'Evento sin descripción textual.'}
                       </div>
                    </div>

                    <div style={{ flex: 1 }}>
                       <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>RESOLUCIÓN / NOTAS PRIVADAS</label>
                       <textarea 
                          placeholder="Añada una resolución o comentario interno..."
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          style={{ ...styles.input, height: '120px', fontSize: '0.85rem', resize: 'none' }}
                       />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       <button 
                          className="primary" 
                          onClick={() => {
                             const updatedEvents = events.map(ev => 
                               ev.id === mediaModal.event.id ? { ...ev, status: 'Cerrado', resolution: resolutionText } : ev
                             );
                             localStorage.setItem('centinela_events', JSON.stringify(updatedEvents));
                             setEvents(updatedEvents);
                             setMediaModal({ show: false, content: null, type: null, event: null });
                          }}
                          style={{ padding: '15px', borderRadius: '14px', width: '100%' }}
                       >
                          CERRAR EVENTO
                       </button>
                       <button 
                          onClick={() => setMediaModal({ show: false, content: null, type: null, event: null })}
                          style={{ padding: '15px', borderRadius: '14px', width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                       >
                          SALIR SIN CAMBIAR
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

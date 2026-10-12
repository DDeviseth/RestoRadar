import React from 'react';

export default function CuisinePhoto({ photo }) {
  return (
    <div className="card-photo">
      <img
        src={'/images/' + photo.file + '.jpg'}
        alt={photo.alt}
        width={1200}
        height={800}
        loading="lazy"
      />
    </div>
  );
}

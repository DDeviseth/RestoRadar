import React, { useState } from 'react';
import { Button, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { names } from '../constants.js';

export default function RestaurantEditor({ record, cuisines, busy, error, cancel, save }) {
  const [form, setForm] = useState({
    name: record.name || '',
    cuisine: record.cuisine || '',
    borough: record.borough || '',
    restaurant_id: record.restaurant_id || '',
    description: record.description || '',
    building: record.address?.building || '',
    street: record.address?.street || '',
    zipcode: record.address?.zipcode || '',
  });
  const input = (key, label, props = {}) => (
    <label>
      {label}
      <input
        {...props}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({
          ...form,
          address: {
            building: form.building,
            street: form.street,
            zipcode: form.zipcode,
            coord: record.address?.coord || [],
          },
        });
      }}
    >
      <ModalHeader>{record.new ? 'Add a restaurant' : 'Edit restaurant'}</ModalHeader>
      <ModalBody>
        <p className="muted">
          {record.new
            ? 'Create a listing. Inspection history starts empty.'
            : 'Update the listing. Existing inspection history is preserved.'}
        </p>
        <div className="editor-grid">
          {input('name', 'Restaurant name', { required: true, maxLength: 200 })}
          {input('restaurant_id', 'Restaurant ID', {
            required: true,
            pattern: '[0-9]{8}',
            title: 'Eight digits',
            readOnly: !record.new,
          })}
          <label>
            Cuisine
            <input
              list="cuisines"
              required
              value={form.cuisine}
              maxLength={200}
              onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
            />
            <datalist id="cuisines">
              {cuisines.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </datalist>
          </label>
          <label>
            Borough
            <select
              required
              value={form.borough}
              onChange={(e) => setForm({ ...form, borough: e.target.value })}
            >
              <option value="">Choose a borough</option>
              {names.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          {input('building', 'Building', { required: true })}
          {input('street', 'Street', { required: true })}
          {input('zipcode', 'ZIP code', {
            required: true,
            pattern: '[0-9]{5}',
            title: 'Five digits',
          })}
          <label className="full-width">
            Description
            <textarea
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="light" isDisabled={busy} onPress={cancel}>
          Cancel
        </Button>
        <Button type="submit" className="orange-button" isLoading={busy}>
          {record.new ? 'Save restaurant' : 'Save changes'}
        </Button>
      </ModalFooter>
    </form>
  );
}

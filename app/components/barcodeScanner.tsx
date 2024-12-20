'use client';

import React, { useRef, useState } from 'react';
import Scanner from './Scanner';
import FetchHp from './fetchHp';
import FetchRecipes from './fetchRecipes';
import { useHealthPoints } from '../contexts/HealthPointsContext';
import { redirect } from 'next/navigation';
import RecipeCard from './recipeCard';
import FetchResponse from './fetchResponse';
import FetchCal from './fetchCal';
import IndianCard from './indianCard';
import AmericanCard from './americanCard';

interface BarcodeScannerProps {
  mode: 'freestyle' | 'cornfusion' | 'indian' | 'american';
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ mode }) => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Array<{ codeResult: { code: string } }>>([]);
  const recentlyScanned = useRef<Set<string>>(new Set());
  const { healthPoints, setHealthPoints } = useHealthPoints();
  const [currentProductID, setCurrentProductID] = useState<number | null>(null);
  const [response, setResponse] = useState<string>('');
  const [cal, setCal] = useState(0);
  const [isIndian, setIsIndian] = useState("");
  const [hasFetchedResponse, setHasFetchedResponse] = useState(false);


  // States for recipes in cornfusion mode
  const [names, setNames] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[][]>([]);
  const [showRecipes, setShowRecipes] = useState(false); // Controls recipe display in cornfusion mode

  const handleHpFetchComplete = (result: number): void => {
    setHealthPoints(result); // Update healthPoints context
    setCurrentProductID(null); // Clear currentProductID after fetch
  };

  const handleRecipeFetchComplete = (fetchedNames: string[], fetchedIngredients: string[][]) => {
    setNames(fetchedNames);
    setIngredients(fetchedIngredients);
    setShowRecipes(true); // Show recipes after fetching is complete
  };

  const handleResponseFetchComplete = (fetchedResponse: string) => {
    setIsIndian(fetchedResponse);
    setHasFetchedResponse(true); // Mark that the response has been fetched
  };
  
  

  const handleCalFetchComplete = (fetchedCal: number) => {
    setCal(fetchedCal);
  };

  const toggleScanning = () => {
    if (scanning) {
      // Handle stopping the scanner
      setScanning(false);
      if (mode === 'freestyle') {
        redirect('/freestyle/anal'); // Navigate to /freestyle/anal when stopping in freestyle mode
      }
    } else {
      // Handle starting the scanner
      recentlyScanned.current.clear();
      setScanning(true);
      setHasFetchedResponse(false); // Reset the fetched response state
    }
  };

  const handleDetected = (result: { codeResult: { code: string } }) => {
    const newCode = result.codeResult.code;

    if (!recentlyScanned.current.has(newCode)) {
      setResults((prevResults) => [...prevResults, result]);
      recentlyScanned.current.add(newCode);
      setCurrentProductID(Number(newCode));

      if (mode === 'cornfusion') {
        setScanning(false); // Stop scanning immediately for cornfusion mode
      }

      setTimeout(() => {
        recentlyScanned.current.delete(newCode);
      }, 2500);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Barcode Scanner</h1>

      {/* Render Scanner while scanning is active */}
      {scanning && (mode === 'freestyle' || mode === 'indian' || mode === 'american') && <Scanner onDetected={handleDetected} />}
      {scanning && mode === 'cornfusion' && !showRecipes && <Scanner onDetected={handleDetected} />}

      {/* Trigger FetchHp dynamically for freestyle mode */}
      {currentProductID !== null && (mode === 'freestyle' || mode === 'indian' || mode === 'american') && (
        <FetchHp productID={currentProductID} onFetchComplete={handleHpFetchComplete} />
      )}
      
      {/* Trigger FetchResponse for indian mode */}
      {!scanning && mode === 'indian' && (
        <FetchResponse onFetchComplete={handleResponseFetchComplete} />
      )}
      {!scanning && mode === 'indian' && hasFetchedResponse && (
        <IndianCard isIndian={isIndian} />
      )}


      {/* Trigger FetchRecipes dynamically for cornfusion mode */}
      {currentProductID !== null && mode === 'cornfusion' && !showRecipes && (
        <FetchRecipes productID={currentProductID} onFetchComplete={handleRecipeFetchComplete} />
      )}

      {/* Trigger FetchCal for american mode */}
      {!scanning && mode === 'american' && (
        <FetchCal onFetchComplete={handleCalFetchComplete} />
      )}
      {!scanning && mode === 'american' && cal && (
        <AmericanCard cals={cal} />
      )}

      <button
        onClick={toggleScanning}
        className={`nes-btn !text-black ${scanning ? 'is-error' : 'is-success'}`}
        style={{ marginTop: '20px', padding: '10px 20px' }}
        disabled={mode === 'cornfusion' && showRecipes} // Disable scanning button when recipes are shown
      >
        {scanning ? 'Checkout' : 'Start ►'}
      </button>

      {/* Show scanned barcodes for freestyle mode */}
      {!scanning && (mode === 'freestyle' || mode === 'indian' || mode === 'american') && (
        <div style={{ marginTop: '20px' }}>
          <h2>Scanned Barcodes</h2>
          <ul>
            {results.map((result, index) => (
              <li key={`${result.codeResult.code}-${index}`}>
                Barcode {index + 1}: <strong>{result.codeResult.code}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Display recipes for cornfusion mode */}
      {!scanning && mode === 'cornfusion' && showRecipes && (
        <div style={{ marginTop: '20px' }}>
          <h2>Recipes</h2>
          <RecipeCard titles={names} recipes={ingredients} />
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;

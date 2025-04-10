import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { LuUpload, LuDownload, LuAlertCircle, LuCheckCircle2 } from 'react-icons/lu';
import Papa from 'papaparse';

interface CSVImportProps {
  clientId: number;
}

export default function CSVImport({ clientId }: CSVImportProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResults(null); // Reset results when a new file is selected
    }
  };
  
  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Parse CSV
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });
      
      if (parseResult.errors.length > 0) {
        throw new Error(`Error parsing CSV: ${parseResult.errors[0].message}`);
      }
      
      // Send to API
      const response = await apiRequest('/api/import/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          data: parseResult.data,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import users');
      }
      
      const results = await response.json();
      
      // Set results
      setImportResults(results);
      
      // Refresh user list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${results.success} users with ${results.errors.length} errors`,
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import users',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const downloadTemplate = () => {
    // Create template CSV content
    const headers = [
      'name', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'groupName',
      'address', 'country', 'state', 'city', 'zipcode', 'shoesBrandModel', 
      'gpsWatchModel', 'hydrationSupplement', 'medicalHistory', 'bloodGroup',
      'tshirtSize', 'allergies', 'emergencyContactName', 'emergencyContactNumber',
      'fitnessLevel', 'fitnessGoals', 'weight', 'height'
    ].join(',');
    
    // Sample data
    const sampleRow = [
      'John Doe', 'johndoe@example.com', '1234567890', '1990-01-01', 'male', 'Team Alpha',
      '123 Main St', 'USA', 'CA', 'San Francisco', '94105', 'Nike ZoomX',
      'Garmin Forerunner 945', 'Gatorade', '', 'O+',
      'L', '', 'Jane Doe', '0987654321',
      'intermediate', 'Run a marathon', '70.5', '175'
    ].join(',');
    
    const csvContent = `${headers}\n${sampleRow}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LuUpload className="h-5 w-5" />
          Bulk User Import
        </CardTitle>
        <CardDescription>
          Import multiple users from a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={downloadTemplate}
            >
              <LuDownload className="h-4 w-4" />
              Template
            </Button>
          </div>
          
          {selectedFile && (
            <div className="rounded-lg bg-blue-50 p-4 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
              <div className="flex items-center gap-2">
                <span className="font-medium">Selected file:</span>
                <span>{selectedFile.name}</span>
                <span className="text-sm">({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
            </div>
          )}
          
          {importResults && (
            <div className="space-y-3">
              <Alert variant={importResults.errors.length > 0 ? "default" : "success"}>
                <LuCheckCircle2 className="h-4 w-4" />
                <AlertTitle>Import Results</AlertTitle>
                <AlertDescription>
                  Successfully imported {importResults.success} users.
                  {importResults.errors.length > 0 && (
                    <span> Failed to import {importResults.errors.length} users.</span>
                  )}
                </AlertDescription>
              </Alert>
              
              {importResults.errors.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Errors:</h4>
                  <ul className="space-y-1 text-sm">
                    {importResults.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2 text-red-600">
                        <LuAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>
                          Row {error.row}: {error.error}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          className="flex items-center gap-2"
        >
          <LuUpload className="h-4 w-4" />
          {isImporting ? 'Importing...' : 'Import Users'}
        </Button>
      </CardFooter>
    </Card>
  );
}
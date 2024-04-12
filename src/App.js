import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [applications, setApplications] = useState([]);
    const [showRejected, setShowRejected] = useState(false);
    const [id, setId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        fetch('http://localhost:8080/applications')
            .then(response => response.json())
            .then(data => {
                const storedHiddenIds = JSON.parse(localStorage.getItem('hiddenApplicationIds')) || [];
                const visibleApplications = data.map(app => ({
                    ...app,
                    isVisible: !storedHiddenIds.includes(app.id) && app.applicationState !== 'Rejected',
                    candidate: app.candidate || {}
                }));
                setApplications(visibleApplications);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const rejectApplication = (applicationId) => {
        fetch(`http://localhost:8080/applications/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Accept': '*/*'
            }
        })
            .then(response => {
                if (response.ok) {
                    setApplications(applications.map(app => {
                        if (app.id === applicationId) {
                            return { ...app, applicationState: 'Rejected', isVisible: showRejected };
                        }
                        return app;
                    }));
                } else {
                    console.error('Failed to reject the application.');
                }
            })
            .catch(error => console.error('Error rejecting application:', error));
    };

    const hideApplication = (applicationId) => {
        const updatedApplications = applications.map(app => {
            if (app.id === applicationId) {
                return { ...app, isVisible: false };
            }
            return app;
        });
        setApplications(updatedApplications);
        const hiddenIds = updatedApplications.filter(app => !app.isVisible).map(app => app.id);
        localStorage.setItem('hiddenApplicationIds', JSON.stringify(hiddenIds));
    };

    const toggleRejectedVisibility = () => {
        setShowRejected(!showRejected);
        setApplications(applications.map(app => {
            if (app.applicationState === 'Rejected' && showRejected) {
                return { ...app, isVisible: false};
            }
            if (app.applicationState === 'Rejected' && !showRejected) {
                return { ...app, isVisible: true};
            }
            return app;
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const apiUrl = 'http://localhost:8080/applications';
        const payload = {
            id: id,
            applicationState: "New",
            candidate: {
                id: 1,
                firstName: firstName,
                lastName: lastName
            },
            updatedOn: new Date().toISOString()
        };

        try {
            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 201) {
                setApplications([...applications, {
                    ...response.data,
                    isVisible: true,
                    candidate: response.data.candidate || {}
                }]);
                setId('');
                setFirstName('');
                setLastName('');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
        }
    };

    return (
        <div className="App">
            <h1>Applications Dashboard</h1>
            <button onClick={toggleRejectedVisibility}>
                {showRejected ? 'Hide Rejected' : 'Show Rejected'}
            </button>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="ID" value={id} onChange={e => setId(e.target.value)} />
                <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                <button type="submit">Submit Application</button>
            </form>
            <table>
                <thead>
                <tr>
                    <th width={120}>Application ID</th>
                    <th width={220}>Application State</th>
                    <th width={230}>Candidate Name</th>
                    <th width={400}>Submitted</th>
                    <th width={80}>Action</th>
                </tr>
                </thead>
                <tbody>
                {applications.map(application => application.isVisible && (
                    <tr key={application.id}>
                        <td>{application.id}</td>
                        <td>{application.applicationState}</td>
                        <td>{`${application.candidate.firstName || ''} ${application.candidate.lastName || ''}`}</td>
                        <td>{application.updatedOn}</td>
                        <td>
                            {application.applicationState !== 'Rejected' ? (
                                <button onClick={() => rejectApplication(application.id)}>Reject</button>
                            ) : (
                                application.isVisible && <button onClick={() => hideApplication(application.id)}>Hide</button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;